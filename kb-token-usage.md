# Token usage and context efficiency

Prefix: TOK. Last verified for all entries: 2026-10-12, on Claude Code v2.1.296 and the docs live that day. Model names and prices are those on the docs that day (Fable 5.1, Opus 5.5, Sonnet 5.5, Haiku 5.5). `docs.claude.com` now redirects to `platform.claude.com/docs`. Entries marked "local measurement" come from our own transcripts in `~/.claude/projects/` (30 days, 209 main sessions, 482 transcript files, one machine), analysed on 2026-10-12.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| What costs the most in a Claude Code session? | Re-reading the whole context on every turn. For us, cache reads are 52% of list-price cost, and turns over 200k context use 54% of input tokens. | TOK-008, TOK-009 |
| How big is the fixed overhead before I type anything? | About 25–27k tokens of system prompt + tool definitions, about 37–42k on our first turn including CLAUDE.md, skills and the prompt. A subagent starts at about 28.5k. | TOK-002, TOK-006 |
| How do I see what fills my context? | `/context` (or `/context all`). For spend, `/usage` (`/cost` and `/stats` are aliases). | TOK-010 |
| How do plan limits work? | A 5-hour session window plus a weekly limit, shared by claude.ai, Claude Code and Desktop. Max is 5x or 20x Pro per session. | TOK-014 |
| Do many MCP servers still bloat context? | Much less: Claude Code defers MCP tool schemas by default, so only names and server instructions load. CLIs (`gh`, `aws`) are still cheaper. | TOK-020, TOK-022 |
| When should I `/clear` vs `/compact`? | `/clear` between unrelated tasks, or after two failed corrections. `/compact <focus>` at a natural break inside one long task. | TOK-030, TOK-031 |
| When does auto-compact fire? | At about 967K tokens on native-1M models, and at 200K on 4.6 models without `[1m]`. Lower it with `/autocompact` or `autoCompactWindow`. | TOK-007, TOK-032 |
| Which model should subagents use? | Built-in Explore inherits the main model (Opus, if that's what you run). Set `model:` per agent or `CLAUDE_CODE_SUBAGENT_MODEL` for cheaper defaults. | TOK-036 |
| How long does the prompt cache live in Claude Code? | 1 hour for the main conversation on a subscription, 5 minutes for subagents, on an API key, or when drawing usage credits. | TOK-052 |
| What breaks the cache mid-session? | Switching model, fast mode, effort on older models, upgrading Claude Code, and MCP changes when tool search is off. Editing CLAUDE.md does not break it (but doesn't apply until `/clear`). | TOK-053 |
| How much do batches save? | 50% on input and output, and it stacks with caching. Most finish within 1 hour, max 24 hours. | TOK-054 |
| How big can a skill description be, and what does it cost? | Every skill's name + description is in context on every turn, within a budget of 1% of the window. Each entry is capped at 1,536 characters. Keep it short and front-load triggers. | TOK-005, TOK-061 |
| How long should CLAUDE.md be? | Under 200 lines per file. `@imports` don't reduce cost. Move procedures to skills or `paths:`-scoped rules. | TOK-003, TOK-065 |
| What do images and PDFs cost? | An image costs ⌈w/28⌉×⌈h/28⌉ tokens (max 1,568 standard, 4,784 high-res). A PDF costs 1,500–3,000 tokens per page plus image cost. | TOK-043 |
| Which community tracker should I use? | `ccusage` for history (reads the JSONL). For live use, the built-in status line JSON is enough, or use `claude-hud` or `ccstatusline`. | TOK-080, TOK-082 |

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

---

## [TOK-001] What fills the context, by feature
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Features overview: context costs](https://code.claude.com/docs/en/features-overview#understand-context-costs), [Context window](https://code.claude.com/docs/en/context-window)
- Related: TOK-002, TOK-005, TOK-020, TOK-065

Each request sends, in this order: system prompt and tool definitions, then project context (CLAUDE.md, auto memory, unscoped rules), then the conversation. What each feature costs:

| Feature | In context |
|---|---|
| CLAUDE.md, output style, unscoped rules | Full content, every request |
| Skills | Name + description every request. Body only once invoked, then stays. |
| MCP | Tool names + server instructions. Schemas only when loaded via tool search. |
| Subagents | Isolated. Only the final summary returns. |
| Hooks | Zero, unless they return `additionalContext` (plain stdout on exit 0 doesn't enter) |
| File reads, tool output, messages | Everything, every request after it arrives |

The docs' context-window page is an interactive simulation with "representative numbers": system prompt 4,200, project CLAUDE.md 1,800, file reads 1,100–2,400 each, a subagent summary of 420 tokens after the subagent read 6,100 tokens. It doesn't show built-in tool definitions, which are the biggest fixed item (TOK-002). Use `/context` for real figures.

## [TOK-002] Fixed overhead per session (measured)
- Type: fact
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
- Sources: [Costs: why usage climbs in a long session](https://code.claude.com/docs/en/costs), local transcripts
- Related: TOK-009, TOK-030, TOK-032

Claude Code re-sends the full conversation with every request; the cached part is billed at cache-read rates. A 300-turn session at 300k context reads about 90M tokens. Performance also degrades as context fills ("context rot", [Best practices](https://code.claude.com/docs/en/best-practices)).

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
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
- Sources: [Commands](https://code.claude.com/docs/en/commands), [Costs](https://code.claude.com/docs/en/costs)
- Related: TOK-011, TOK-013

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

## [TOK-011] Status line JSON fields for live monitoring
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
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

## [TOK-012] OpenTelemetry metrics for teams
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Monitoring usage](https://code.claude.com/docs/en/monitoring-usage), [Costs](https://code.claude.com/docs/en/costs)
- Related: TOK-018

Turn it on with `CLAUDE_CODE_ENABLE_TELEMETRY=1`, then set `OTEL_METRICS_EXPORTER` (otlp, prometheus or console), `OTEL_LOGS_EXPORTER` and `OTEL_EXPORTER_OTLP_ENDPOINT`.

Metrics:
- `claude_code.token.usage`, with `type` = input, output, cacheRead or cacheCreation.
- `claude_code.cost.usage` (USD).
- Both are incremented per API request and tagged with `model`, `query_source` (main, subagent or auxiliary), `effort`, `agent.name`, `skill.name`, `plugin.name` and `mcp_server.name`. That makes it possible to see which skill or MCP server drives spend.

The `api_request` log event carries `cost_usd`. Prompt and response content logging is off by default.

The docs call OTel "the only option that streams per-user token and cost metrics into your own observability stack in near real time." It's the route for Bedrock, Vertex and Foundry, which the Analytics API doesn't cover. For one user it's overkill; use TOK-010, TOK-011 and TOK-013.

## [TOK-013] Local transcripts as a usage data source
- Type: tool
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-12
- Sources: [.claude directory](https://code.claude.com/docs/en/claude-directory), local inspection
- Related: TOK-080, TOK-008

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

Confidence note: the transcript location is documented (official-docs); the `usage` schema is observed locally and not a documented contract.

## [TOK-014] claude.ai plan limits: 5-hour and weekly windows
- Type: fact
- Applies to: claude.ai, Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Usage limit best practices](https://support.claude.com/en/articles/11647753), [Using Claude Code with Pro/Max](https://support.claude.com/en/articles/11145838), [Max plan](https://support.claude.com/en/articles/11049741), [Pro plan](https://support.claude.com/en/articles/8325606), [Team plan](https://support.claude.com/en/articles/9266767), [Fable usage](https://support.claude.com/en/articles/15424964), [Usage credits](https://support.claude.com/en/articles/12429409)
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
- Last verified: 2026-10-12
- Sources: [Usage limit best practices](https://support.claude.com/en/articles/11647753), [Usage and length limits](https://support.claude.com/en/articles/9797557)
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
- Last verified: 2026-10-12
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
- Applies to: Claude API, Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
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
- All three need an Admin key and aren't available to individual accounts.
- The Console has usage and cost pages, workspace spend limits and rate limits; Claude Code gets an auto-created workspace.
- The docs give per-user TPM recommendations, from 200–300k for 1–5 users down to 10–15k for 500+.

## [TOK-020] MCP tool search is on by default in Claude Code
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
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
- As of v2.1.296 (2026-10-09) the default limit on MCP tool descriptions sent up front and on server instructions is 4,096 characters, up from 2,048 (`CLAUDE_CODE_MAX_MCP_DESCRIPTION_LENGTH`). The MCP and env-vars pages still say 2,048. Changelog v2.1.295 says descriptions loaded *through tool search* are cut at 16,384.

History: v2.1.7 (Jan 2026) made `auto` at 10% the default, and later releases switched to defer-all. Blog posts that describe 10% auto as the default are outdated.

## [TOK-021] MCP overhead without deferral
- Type: fact
- Applies to: Claude API, Claude Code (when tool search is off)
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Advanced tool use](https://www.anthropic.com/engineering/advanced-tool-use), [Tool search tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool), [PolicyLayer GitHub MCP cost](https://policylayer.com/token-cost/github), [Unblocked MCP budget](https://getunblocked.com/blog/mcp-token-budget-autopsy/)
- Related: TOK-020, TOK-024

Anthropic figures:
- Five servers (GitHub, Slack, Sentry, Grafana, Splunk), 58 tools: "approximately 55K tokens before the conversation even starts". Adding Jira (about 17K) pushes it past 100K.
- Anthropic saw up to 134K internally.
- Tool Search Tool: about 77K drops to about 8.7K. The post says 85%; the arithmetic gives about 89%.
- MCP-eval accuracy improved: Opus 4 from 49% to 74%, Opus 4.5 from 79.5% to 88.1%.
- Selection accuracy degrades past 30–50 tools.

Community per-server numbers, measured with a GPT tokenizer:
- GitHub MCP is about 14k tokens for 86 tools (PolicyLayer).
- Median server about 1.1k, p90 about 6.1k.
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
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
- Sources: [Context window](https://code.claude.com/docs/en/context-window), [Costs](https://code.claude.com/docs/en/costs), [Skills](https://code.claude.com/docs/en/skills), [Prompt caching](https://code.claude.com/docs/en/prompt-caching)
- Related: TOK-032, SKILL-006

Steering the summary:
- `/compact Focus on code samples and API usage` tells the summarizer what to keep.
- A `# Compact instructions` section in CLAUDE.md applies every time. It is advisory; how strictly it's honoured is unverified.

What survives:
- "System prompt, CLAUDE.md, memory, and MCP tools reload automatically."
- Up to 5 recently modified files are re-read. A file over 5,000 tokens comes back as a path only.
- Invoked skills are re-attached: the first 5,000 tokens each, 25,000 total.
- Nested CLAUDE.md files and `paths:` rules reload on demand.
- The skill listing doesn't reload. Hook-added context and conversation-only instructions are lost.

Cost: compaction is itself a request over the whole history. While the cache is warm it reads the prefix at cache rates; after a break past the TTL it reprocesses everything uncached. So compact at a natural break, not mid-task. Hooks: `PreCompact` (exit 2 blocks), `PostCompact`, and `SessionStart` with matcher `compact` to re-inject context.

## [TOK-032] Tuning auto-compact
- Type: recommendation
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-12
- Sources: [Model config: set the auto-compact window](https://code.claude.com/docs/en/model-config), [Env vars](https://code.claude.com/docs/en/env-vars)
- Related: TOK-007, TOK-008, TOK-031

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

A lower window trades lossy summaries for cost. Pair it with compact instructions (TOK-031) and a handoff habit (R3).

Confidence note: the knobs are documented (official-docs); the savings come from our local simulation.

## [TOK-033] Rewind, partial summarize and `/btw`
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
- Sources: [Sessions: resume from a summary](https://code.claude.com/docs/en/sessions#resume-from-a-summary), [Costs](https://code.claude.com/docs/en/costs)
- Related: TOK-052, TOK-086

"Your first message after a break longer than the cache lifetime misses the cache and reprocesses your full context." The lifetime is 1 hour on a subscription and 5 minutes on an API key.

`--resume` and `--continue` re-send the full history. On Pro and Max, for sessions idle more than about 1 hour and over 100k tokens, Claude Code offers "Resume from summary", which runs `/compact`.

Idle sessions can still spend: scheduled tasks, cross-session messages and goal check-ins each send the full context. Background helpers (titles, resume summaries) cost under $0.04 per session.

In our data, full rebuilds after the first turn (cache writes over 40k) were rare: 11 turns, 8% of main-session cache writes. Idle gaps are a minor cost driver for us; context length dominates (TOK-008).

Confidence note: the cache and resume behavior is documented; the share of rebuilds is our local measurement (single-source).

## [TOK-035] Delegate verbose work to subagents
- Type: pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Best practices](https://code.claude.com/docs/en/best-practices), [Sub-agents: isolate high-volume operations](https://code.claude.com/docs/en/sub-agents#isolate-high-volume-operations), [Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- Related: TOK-006, TOK-009, TOK-036, ORCH-020, ORCH-034

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

## [TOK-036] Subagent model selection
- Type: recommendation
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
- Sources: [Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system), [Costs: agent teams](https://code.claude.com/docs/en/costs)
- Related: ORCH-020, ORCH-025, ORCH-010

Merged into ORCH-020 (kb-orchestration.md) on 2026-10-12. Token multipliers are in ORCH-020, scaling rules in ORCH-025 and agent-team cost in ORCH-010.

## [TOK-038] API context management: compaction, context editing, memory tool
- Type: tool
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Compaction](https://platform.claude.com/docs/en/build-with-claude/compaction), [Compaction threshold](https://platform.claude.com/docs/en/build-with-claude/compaction-threshold), [Context editing](https://platform.claude.com/docs/en/build-with-claude/context-editing), [Memory tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool), [Context windows](https://platform.claude.com/docs/en/build-with-claude/context-windows)
- Related: TOK-050, TOK-055

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

## [TOK-040] Read tool limits and partial reads
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Tools reference: Read](https://code.claude.com/docs/en/tools-reference#read-tool-behavior), [Skill best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- Related: TOK-041, TOK-062

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

## [TOK-041] Search before reading; code intelligence
- Type: pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
- Sources: [Tools reference: output limits](https://code.claude.com/docs/en/tools-reference#output-limits), [Costs: offload processing to hooks](https://code.claude.com/docs/en/costs), [Hooks](https://code.claude.com/docs/en/hooks)
- Related: TOK-009, TOK-083, TOK-023

Limits:
- Successful output is inline up to about 30k characters (`BASH_MAX_OUTPUT_LENGTH`, max 150k; setting `bashOutputMaxChars`). Beyond that Claude gets a file path plus a 2k preview.
- Failing commands get about 10k characters, head and tail.

Official hook pattern: a `PreToolUse` hook on Bash rewrites `npm test` and `pytest` via `updatedInput` to `… 2>&1 | grep -A 5 -E '(FAIL|ERROR|error:)' | head -100`. The docs say this cuts a 10,000-line log "from tens of thousands of tokens to hundreds". `PostToolUse` can replace output with `updatedToolOutput`.

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
- Last verified: 2026-10-12
- Sources: [Terminal config: paste large content](https://code.claude.com/docs/en/terminal-config#paste-large-content), [Vision](https://platform.claude.com/docs/en/build-with-claude/vision), [PDF support](https://platform.claude.com/docs/en/build-with-claude/pdf-support)
- Related: TOK-009, TOK-040

**Pastes:** pastes over 800 characters collapse to `[Pasted text #N]`, but the full text is still sent. "Write the content to a file and ask Claude to read it instead of pasting." Piping works too: `cat log | claude -p "…"`.

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
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
- Sources: [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching), [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- Related: TOK-017, TOK-051, TOK-054

Basics:
- The prefix order is `tools` → `system` → `messages`. A hit needs "100% identical prompt segments".
- Up to 4 breakpoints. Each looks back at most 20 block positions; a conversation that grows 20+ blocks past the last write misses.
- TTL is 5 minutes by default, refreshed free on each hit. Set `"ttl": "1h"` for gaps between 5 minutes and 1 hour.
- Pay-off: after 1 read for 5m writes (1.25x), after 2 reads for 1h writes (2x).

Minimum cacheable length varies by model:
- 512 tokens: Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable.
- 1,024: Sonnet 5, Opus 4.8.
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
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
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

Scope: the cache is "effectively scoped to one machine and directory". Parallel sessions in one directory share it.

Verify with `claude -p "hi" --output-format json` and look at `usage.cache_creation`. The Claude Code team alerts on cache hit rate and declares an incident if it's too low ("prompt caching is everything").

## [TOK-053] What invalidates the Claude Code cache
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Prompt caching (Claude Code)](https://code.claude.com/docs/en/prompt-caching)
- Related: TOK-052, TOK-020, TOK-070

**Breaks the cache:**
- `/model` switches: each model has its own cache. `opusplan` toggles and skills with a different `model:` count too.
- Effort changes on older models. On Opus, Sonnet and Haiku 5.5 and Fable 5.1, effort changes are cache-safe with an API key or subscription, but not on Bedrock or Vertex.
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
- Last verified: 2026-10-12
- Sources: [Batch processing](https://platform.claude.com/docs/en/build-with-claude/batch-processing), [Rate limits](https://platform.claude.com/docs/en/api/rate-limits), [Cookbook: batch processing](https://github.com/anthropics/claude-cookbooks/blob/main/misc/batch_processing.ipynb)
- Related: TOK-017, TOK-050

Pricing and limits:
- "All usage is charged at 50% of the standard API prices." For example, Opus 5.5 is $2/$10 and Sonnet 5.5 is $1/$5.
- A batch holds up to 100,000 requests or 256 MB.
- "Most batches complete within 1 hour". Batches expire after 24 hours, and expired requests aren't billed.
- Results are kept for 29 days from creation.

**With caching:** the discounts stack, but hits are best-effort because requests run concurrently. Typical hit rates are 30–98%. Use identical `cache_control` blocks and consider the 1h TTL.

Not available: fast mode and mid-batch tool loops.

Good fits: evals, bulk classification or extraction, nightly jobs, re-verifying this KB's sources. Not for interactive work. The docs also suggest batch for thinking budgets above 32k, to avoid timeouts.

## [TOK-055] Effort and thinking as cost levers
- Type: fact
- Applies to: Claude API, Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Effort](https://platform.claude.com/docs/en/build-with-claude/effort), [Thinking cost](https://platform.claude.com/docs/en/build-with-claude/thinking-steering-and-cost), [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking), [Costs](https://code.claude.com/docs/en/costs)
- Related: TOK-017, TOK-053, ORCH-028

**Effort** (`output_config.effort`):
- Levels: low, medium, high, xhigh, max. It affects all output tokens: text, tool calls and thinking.
- Defaults: "high" on most models, **medium on Opus 5.5 and Haiku 5.5**.
- "low" suits simple tasks "such as subagents". "max adds significant cost for relatively small quality gains."
- Per-message effort (beta `mid-conversation-output-config-2026-07-01`) changes effort without breaking the cache.

**Thinking:**
- Billed as output, in full, even when summarized.
- Manual `budget_tokens` is deprecated on 4.6 and rejected on 4.7+. Use adaptive thinking plus effort instead.
- In Claude Code, thinking can't be turned off on Opus, Sonnet and Haiku 5.5 or Fable. Use `/effort` instead; `MAX_THINKING_TOKENS` applies only to fixed-budget models.
- On current models, earlier-turn thinking stays in context as input (TOK-038).

## [TOK-056] Order of cost levers (official cookbook)
- Type: recommendation
- Applies to: Claude API
- Confidence: official-example
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
- Sources: [Agent Skills overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview), [Equipping agents with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- Related: SKILL-004

Merged into SKILL-004 (kb-skills.md) on 2026-10-12. Read that entry for the three loading levels and their cost.

## [TOK-061] Writing skill descriptions
- Type: recommendation
- Applies to: Claude Code, general
- Confidence: community-consensus
- Last verified: 2026-10-12
- Sources: [Skill best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices), [anthropics/skills skill-creator](https://github.com/anthropics/skills/tree/main/skills/skill-creator), [obra/superpowers writing-skills](https://github.com/obra/superpowers), [Vercel: AGENTS.md vs skills](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals)
- Related: TOK-005, TOK-064, SKILL-011, SKILL-012, SKILL-013

Limits and content rules (what + when, third person, negative triggers, no workflow summary): see SKILL-003, SKILL-011, SKILL-012 and SKILL-013 (merged there 2026-10-12). This entry keeps the cost side.

The tension:
- Anthropic's skill-creator says make descriptions "a little bit 'pushy'" because Claude tends to undertrigger. Its docx, xlsx and pptx descriptions are 750–970 characters.
- Every character is paid on every turn, and an overflowing listing drops descriptions.

Vercel's eval found a skill wasn't invoked in 56% of cases, and a compact AGENTS.md index scored 100%. So knowledge that is always needed belongs in passive context, not a skill.

Our default: about 150–400 characters, triggers first, and `claude plugin eval` with a `tool_used: Skill` grader to check triggering after edits.

Confidence note: the per-turn cost is documented (official-docs); the length guidance is community practice, and Vercel's eval is single-source.

## [TOK-062] SKILL.md size and reference files
- Type: recommendation
- Applies to: Claude Code, general
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Skill best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices), [Skills (Claude Code)](https://code.claude.com/docs/en/skills), [anthropics/skills](https://github.com/anthropics/skills)
- Related: SKILL-004, SKILL-006, SKILL-016, SKILL-017

Size and structure rules (under 500 lines, references one level deep, a TOC over 100 lines, descriptive names, conditional pointers, "Claude is already very smart"): see SKILL-016 and SKILL-017 (merged there 2026-10-12). This entry keeps the measured sizes.

Official skill sizes (SKILL.md lines): xlsx 99, docx 91, pdf 314 plus 8 scripts, skill-creator 485. claude-api is 616 lines and 105 KB, breaking its own guidance, but it loads only the detected language's directory.

Community: one superpowers proposal (#832) cut 14 skills from 3,150 to 977 lines (−69%) by removing what "Claude would do anyway".

## [TOK-063] Scripts and dynamic injection instead of prose
- Type: pattern
- Applies to: Claude Code, general
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Skill best practices: utility scripts](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices), [Skills: dynamic context injection](https://code.claude.com/docs/en/skills), [Equipping agents](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- Related: SKILL-018, SKILL-008

Merged on 2026-10-12: scripts into SKILL-018 and `!` dynamic injection into SKILL-008 (both kb-skills.md). Read those entries.

## [TOK-064] Frontmatter that cuts skill cost
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
- Sources: [Skills: skill content lifecycle](https://code.claude.com/docs/en/skills)
- Related: SKILL-006

Merged into SKILL-006 (kb-skills.md) on 2026-10-12. Read that entry for how an invoked skill stays in context and what compaction keeps.

## [TOK-067] Plugin and subagent-definition overhead
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
- Sources: [Best practices](https://code.claude.com/docs/en/best-practices), [Costs](https://code.claude.com/docs/en/costs), [Prompt caching](https://code.claude.com/docs/en/prompt-caching)
- Related: TOK-030, TOK-032, TOK-035, TOK-053

| Anti-pattern | Instead | Entry |
|---|---|---|
| One session for many unrelated tasks (the "kitchen sink") | `/clear` per task, `/rename` + `/resume` | TOK-030 |
| Correcting the same mistake 3+ times | `/clear` and write a better prompt | TOK-030 |
| Running a 1M window to 400k+ for routine work | Lower `autoCompactWindow`, hand off | TOK-032 |
| Unscoped "investigate X" in the main context | Delegate to a subagent with a return-format cap | TOK-035 |
| Switching `/model` or effort mid-task | Choose at session start | TOK-053 |
| Resuming a big session after hours away | "Resume from summary" or start fresh | TOK-034 |
| Pasting large logs | Save to a file and Read or grep it | TOK-043 |
| Full `git diff` or `gh pr view` dumps | `--stat`, `--json <fields>`, path filters | TOK-042 |
| Raw test output | Filter hook or subagent | TOK-042 |
| Many full-resolution screenshots in the main context | Accessibility snapshot, crop or downscale, or a subagent | TOK-043 |
| Vague prompts ("improve this codebase") | Name the file and the function | TOK-041 |
| Plan mode for one-sentence diffs (single-source) | Skip plan mode when the diff is obvious | — |
| Large agent teams on Opus | Small teams, Sonnet teammates | TOK-037 |

Confidence note: each row's detail and confidence is in the linked entry; rows marked single-source are not documented.

## [TOK-071] Anti-patterns: configuration
- Type: anti-pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
- Sources: [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching), [Batch](https://platform.claude.com/docs/en/build-with-claude/batch-processing), [Cookbook: cost optimization](https://github.com/anthropics/claude-cookbooks/blob/main/cost_optimization/cost_optimization.ipynb)
- Related: TOK-050, TOK-054, TOK-056

| Anti-pattern | Instead |
|---|---|
| No caching, or dynamic content (timestamps, IDs) early in the prompt | Static first, dynamic last, automatic caching |
| Breakpoint on a block that changes each request | Put it on the last stable block |
| Prompt under the model's minimum, assumed cached | Check `cache_creation_input_tokens` > 0 |
| Unstable JSON key order in tool inputs | Serialize deterministically |
| Changing tools, `tool_choice` or thinking mid-conversation | Changing tool definitions invalidates the whole cache; `tool_choice` and thinking changes invalidate message blocks. Keep them fixed; use per-message effort |
| All tools loaded upfront with 10+ tools | Tool search, `defer_loading` |
| Interactive calls for offline jobs | Batch API (−50%) |
| Comparing token counts across tokenizers | Recount per model (4.7+ is about 30% more) |
| Picking a cheaper model before caching and trimming | Follow the lever order in TOK-056 |
| Letting tool results and thinking grow unbounded | Context editing or compaction |

## [TOK-080] ccusage
- Type: tool
- Applies to: Claude Code
- Confidence: community-consensus
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
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
- Last verified: 2026-10-12
- Sources: [jarrodwatts/claude-hud](https://github.com/jarrodwatts/claude-hud), [sirmalloc/ccstatusline](https://github.com/sirmalloc/ccstatusline), [Status line docs](https://code.claude.com/docs/en/statusline)
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

No popular hook warns at a context threshold; feature requests are open. The status line's `used_percentage` is the practical monitor. A DIY script reading TOK-011's fields gives the same core data with no dependency.

## [TOK-083] Output-compression tools (RTK, context-mode)
- Type: tool
- Applies to: Claude Code
- Confidence: unverified
- Last verified: 2026-10-12
- Sources: [rtk-ai/rtk](https://github.com/rtk-ai/rtk), [mksglu/context-mode](https://github.com/mksglu/context-mode)
- Related: TOK-042, TOK-009

**RTK** (about 83k stars, v0.51.0 on 2026-10-02, created Jan 2026):
- A Rust proxy that compresses command output. A PreToolUse hook (`rtk init -g`) rewrites Bash calls, e.g. `git status` becomes `rtk git status`.
- Claims "60–90% on common dev commands" (pytest −90%, cargo build −80%).
- Its README's caveats: it measures Bash output only, estimates tokens as bytes/4, and doesn't touch Read or Grep. Full output is kept on failure.

**context-mode** (about 26.8k stars):
- A plugin that routes tool output through sandboxed MCP `ctx_*` tools, indexes it, and returns summaries, steered by hooks.
- Claims "315 KB → 5.4 KB, 98%" over 14 selected scenarios.
- License is ELv2, not OSI open source.

Neither has independent session-level measurement of cost or task success. Both follow the official hook-filtering pattern (TOK-042). Try one only where Bash output really dominates. For us, large outputs were `git diff`/`gh` dumps, which habits fix (TOK-042).

Confidence note: the savings figures are the vendors' own claims.

## [TOK-084] Code-index MCP servers (Serena, claude-context, code-review-graph)
- Type: tool
- Applies to: Claude Code
- Confidence: unverified
- Last verified: 2026-10-12
- Sources: [oraios/serena](https://github.com/oraios/serena), [zilliztech/claude-context](https://github.com/zilliztech/claude-context), [tirth8205/code-review-graph](https://github.com/tirth8205/code-review-graph)
- Related: TOK-041, TOK-085

**Serena** (about 30k stars):
- LSP symbol-level find and edit tools over MCP.
- Says it is "much more token-efficient" but gives no numbers.

**claude-context** (Zilliz, about 12.6k stars):
- Vector semantic search. Claims "~40% token reduction" with no method.
- Needs Milvus or Zilliz Cloud plus an embedding API key.

**code-review-graph** (about 32k stars):
- Claims a median 63x reduction, but its README admits the baseline is the whole corpus ("an upper bound no real agent pays"). It is worse than a plain read for single-file edits.

All three add MCP tools and dependencies. The official alternative is an LSP code-intelligence plugin (TOK-041); we already run `typescript-lsp`. Don't adopt these for token savings without measuring on our own tasks.

Confidence note: the savings figures are the vendors' own claims.

## [TOK-085] Ideas from other coding agents
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Aider repo map](https://aider.chat/docs/repomap.html), [Aider commands](https://aider.chat/docs/usage/commands.html), [Cline auto-compact](https://docs.cline.bot/features/auto-compact), [Cline new_task](https://docs.cline.bot/exploring-clines-tools/new-task-tool), [Gemini CLI commands](https://google-gemini.github.io/gemini-cli/docs/cli/commands.html)
- Related: TOK-041, TOK-030, TOK-032

**Aider repo map.** A token-budgeted map (default 1k tokens) of files and key symbol signatures, ranked by a dependency-graph algorithm. It transfers as a generated `docs/repo-map.md`, or a `codebase-overview` skill read on demand, instead of re-exploring each session. Aider's `/drop` frees context, the equivalent of rewind-summarize here.

**Cline.** Two ideas:
- A context progress bar. Cline's blog claims quality dips past about 50% (vendor claim).
- A `new_task` tool that ends the session and starts a new one preloaded with a summary, files and next steps.

That handoff idea transfers directly as a user-invoked handoff skill plus `/clear` (R3).

**Gemini CLI** (`/compress`, `/stats`) and **Codex** (`model_auto_compact_token_limit`, custom compact prompt; defaults unverified) add nothing beyond `/compact`, compact instructions and `autoCompactWindow`.

Confidence note: each tool's behavior is from its own docs; Cline's quality figure is a vendor claim and the Codex defaults are unverified.

## [TOK-086] The April 2026 usage-drain incident
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [April 23 postmortem](https://www.anthropic.com/engineering/april-23-postmortem), [claude-code#41930](https://github.com/anthropics/claude-code/issues/41930), [claude-code#38335](https://github.com/anthropics/claude-code/issues/38335)
- Related: TOK-052, TOK-053, TOK-034

Anthropic's postmortem:
- A bug cleared thinking history every turn from 2026-03-26 to 2026-04-10 (v2.1.101). It caused cache misses and "what drove the separate reports of usage limits draining faster than expected".
- The default effort dropped to medium on 2026-03-04 and was reverted 2026-04-07.
- Usage limits were reset on 2026-04-23.

Community reports in #38335 (877 comments) and #41930 include a 5-hour window gone in 19 minutes on Max 20x. Other suspected causes, such as `--resume` breaking the cache, were partly fixed. #78720 (`-p --resume` after a git status change) is still open.

Lessons:
- Watch the `Prompt cache (main)` line in `/usage` and `prompt_cache` in the status line, so a cache regression shows within a session, not at the weekly limit.
- Upgrade deliberately: the first turn after an upgrade rebuilds the cache.

---

Confidence note: the timeline is from Anthropic's postmortem; the drain reports are community issue reports.

## Recommendations for our setup

Baseline (local measurement, 2026-10-07 to 2026-10-12, 6 days, TOK-008; first labelled "30 days", corrected 2026-10-12). Dollar and token totals below are for those 6 days, about a fifth of a month; percentages are unaffected:
- About $1,089 list-price equivalent (about $180 a day), on a subscription.
- 97% of tokens on Opus 5.5.
- Cache reads 52% of cost, cache writes 31%, output 17%.
- 54% of input tokens from turns above 200k context.
- Subagents 19% of cost.
- Tool output entering context: Bash about 6.9M tokens, about 995 screenshots, text file reads about 0.9M.

Setup today: Claude Code v2.1.296, no status line, no custom agents. Four user-scope MCP servers (context7, kubernetes, flux, aws) and four plugins. Global CLAUDE.md is 79 lines.

Ranked by expected savings ÷ effort. Status 2026-10-12: R1, R2, R4 (with the Haiku `Explore` override, ORCH recommendation 13) and R7 are done in `~/.claude`; R3 and R6 are done as the `handoff` and `token-audit` skills (FreekMencke/claude-skills#13 and #14, roadmap FreekMencke/claude-skills#1); R5 is osrs-tracker/osrs-tracker-web#223. R8 was measured on 2026-10-12 (below the table); its pruning step is open. R9 is open but worth little (see the measurement).

| # | Change | What it does / when it triggers | Est. savings | Effort | Evidence |
|---|---|---|---|---|---|
| R1 | **Lower the auto-compact window to 400K** (`"autoCompactWindow": 400000` in `~/.claude/settings.json`) and add a `# Compact instructions` section to global CLAUDE.md ("preserve modified files, open issue/PR numbers, test commands, decisions made") | Compaction fires at 400K instead of about 967K | About 16–30% of input tokens (simulated at 500K and 300K), so about $90–170 over the 6 days (about $15–28 a day). Costs about 20 compactions per 6 days (about 100 a month), each lossy. | 5 min | TOK-008, TOK-031, TOK-032 |
| R2 | **Context status line**: a DIY `~/.claude/statusline.sh` (jq) showing context % and absolute k, 5h/7d `used_percentage`, and `prompt_cache.warm`/TTL; or `claude-hud` | Always visible; makes R1/R3 decisions visible and shows cache regressions early | Indirect: enables R1/R3, catches incidents like TOK-086 | 15 min | TOK-011, TOK-082 |
| R3 | **`handoff` skill** (user-only: `disable-model-invocation: true`, zero listing cost). It writes goal, state, changed files, next steps and open questions to the issue/PR or a scratch file, then tells me to `/clear` and start with "continue from <link>". | `/handoff` when the status line passes about 250K, or when switching task within a repo | Same pool as R1, without auto-summary loss. Each handoff at 250K instead of drifting to 500K halves later per-turn cost. | 30 min | TOK-030, TOK-085, TOK-064 |
| R4 | **Cheaper subagent default**: `"env": {"CLAUDE_CODE_SUBAGENT_MODEL": "sonnet"}` in user settings. The main agent can still pass `model: opus` for hard tasks; per-invocation beats env. Alternatively, a user agent `~/.claude/agents/Explore.md` with `model: sonnet`, read-only tools and `omitClaudeMd: true`. | All subagents without an explicit model, except built-in Explore and Plan: the env var doesn't reach them (ORCH-005), so use the `Explore` override for those | About $50–90 of $115 Opus-subagent spend over the 6 days (5–8% total). Check against the KB's model-selection section first. | 5 min | TOK-036, TOK-006 |
| R5 | **Screenshot hygiene** for `osrs-tracker-web` (cross-repo, so open an issue there): prefer Playwright `browser_snapshot` (about 200 tokens) for structure checks; screenshot elements or a ≤1280px viewport; run visual review loops in a subagent that returns findings | Any UI verification task | Roughly 1–3M image tokens over the 6 days that are later re-read about 58x (TOK-009). Likely the largest single tool-output saving for that repo. | 20 min plus an issue | TOK-043, TOK-023, TOK-035 |
| R6 | **`token-audit` skill** (user-only) with a script that runs the analyses in this file over `~/.claude/projects`: cost split, context-size buckets, re-read multiplier, subagent cost by model, tool-output by tool, largest Bash commands. Dedups by `message.id`. | `/token-audit` monthly, or after a config change, to check R1–R5 worked | None directly; it measures the others. Fills gaps ccusage doesn't cover. | 45 min | TOK-013, TOK-080 |
| R7 | **Output habits in global CLAUDE.md** (2 lines, about 60 tokens a turn): "`git diff --stat` before full diffs; `gh … --json <fields>`; `rg -n` before `sed -n`/`cat`." Optionally a PreToolUse hook for `npm test`/lint per the official example. | Every git/gh/read command | About 1–2M tokens over the 6 days of large Bash output (32% of Bash volume came from 3.5% of calls) | 10 min | TOK-042, TOK-083 |
| R8 | **Skill/plugin audit**: run `/skill-doctor` and `/context all`. Check that `frontend-design` and `playwright` aren't loaded in repos that don't use them (disable per project). Keep custom skill descriptions under about 400 characters. | Once now, then after adding skills or plugins | Small: hundreds to low thousands of tokens per turn | 15 min | TOK-005, TOK-067 |
| R9 | **Project-scope the cluster MCP servers**: move `kubernetes` and `flux` to `home-cluster` (and `aws` to the repos that use it) with `--scope local/project`. Only if the always-on user scope isn't deliberate; our global CLAUDE.md lists them as user-wide on purpose. | Sessions in unrelated repos | Low: about 1–2k tokens per turn of names and server instructions, roughly $4 over the 6 days | 10 min | TOK-020, TOK-022 |

**Measured starting context (2026-10-12).** `claude -p "/context all"` and `claude -p "/skill-doctor"` print their reports as text from the terminal; the desktop Code tab doesn't offer `/skill-doctor` (SKILL-031). In a fresh terminal session in this repo (v2.1.296, Opus 5.5, 400k window):

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
- Skills: 2.8k of the 6.3k listing is the 12 claude.ai-synced skills that `/skill-doctor` shows were never invoked in the last 7 days; about 2.8k more is built-in skills. Done 2026-10-12: all 12 set to `"name-only"` in `skillOverrides` in WSL `~/.claude/settings.json` (no use found in any local transcript since 2026-10-06). Re-measured, the skill listing dropped from 6.3k to 3.6k. claude.ai chat and desktop Local sessions are unaffected (SKILL-058).
- R9: `kubernetes`, `flux` and `aws` tools are deferred, so moving them out of user scope saves only their share of the 2.1k server instructions plus their names. Not worth losing the always-on access.

Not recommended now:
- RTK or context-mode (TOK-083): our big outputs aren't test runs, the claims are unverified, and context-mode is ELv2.
- Serena or claude-context (TOK-084): `typescript-lsp` already covers symbol lookup.
- Raising cache TTLs: rebuilds are only 8% of writes (TOK-034).

## Open questions

1. **Real system prompt and tool sizes.** Answered 2026-10-12: `claude -p "/context all"` in a fresh terminal session in this repo measured a 29.4k starting prefix, close to the 24–27k inferred from `usage`. See "Measured starting context" above.
2. **Compaction quality versus window size.** The R1 simulation ignores compaction cost and lost detail. Re-measure with R6 a month after R1.
3. **How plan usage is weighted.** Are cache reads weighted like API prices (0.05x on Opus 5.5) when counting against 5-hour and weekly limits? Not documented. Our dollar figures are list-price equivalents, not plan percentages.
4. **MCP description cap.** The docs say 2,048 characters; changelog v2.1.295 says 16,384 for descriptions loaded via tool search. Unresolved.
5. **Subagent nesting.** The sub-agents page allows depth 3; the context-window page says the Agent tool is withheld from subagents by default. ORCH-006 sides with depth 3 (sub-agents and env-vars pages, `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`); see INDEX.md, Conflicts.
6. **Skill descriptions and triggering.** No Anthropic benchmark relates description length to trigger rate. The evidence is skill-creator's "pushy" advice, superpowers' anecdotes and Vercel's eval.
7. **Unverified plan changes.** The May 2026 limit doubling and peak-hour changes, and whether per-model weekly meters other than Fable still exist on some plans, are reported only by secondary sources.
8. **Token savers.** No independent session-level measurement of any community token saver (RTK, context-mode, Serena, claude-context) including task success.
9. **Compact instructions.** Is the `# Compact instructions` heading special-cased by the summarizer, or just context it sees?
10. **Resume cache bug.** Is `-p --resume` cache breakage (#78720) still present in v2.1.296?
