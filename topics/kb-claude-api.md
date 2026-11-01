# Building on the Claude API, Agent SDK and Managed Agents

Prefix `CAPI`. This file covers building on Claude as a developer on 2026-10-17:
- which request settings return 400 on the 5.x models;
- model IDs and the retirement schedule;
- tool design: forced tool choice, strict tools, the tool runner, programmatic tool calling, parallel calls;
- structured outputs, stop reasons, refusals, streaming and retries in the TypeScript SDK;
- Files, citations and Batch for a small app;
- the Agent SDK against `claude -p`, Managed Agents scheduled deployments against Claude Code routines;
- how Anthropic says to evaluate an LLM feature;
- added 2026-10-30: preserved thinking and mid-conversation system messages, on-demand compaction, Anthropic's tools in the Messages API (tool search, advisor, code execution, browser use, type strings, token overhead), and Managed Agents sessions, permission policies and hardening;
- added 2026-11-01: the Agent SDK's session store, approval and question callbacks, structured outputs, input modes, Python differences, todo tools, start-up errors, options and result fields;
- also added 2026-11-01: Managed Agents setup and runtime (agent versions, environments, sandbox contents, files, skills, MCP, stream reconnects, deltas, idle logic, threads, outcomes, usage, workflow runs), Claude API OpenTelemetry, the Rate Limits API and MCP tunnels.

It records decisions and pitfalls. For a full API reference, use the bundled `claude-api` skill or the docs. Model choice and effort live in `kb-orchestration.md` (ORCH-026 to ORCH-028), caching and pricing in `kb-token-usage.md` (TOK-050 to TOK-055), prompting in `kb-prompting.md`.

Research basis:
- Researched 2026-10-17 (FreekMencke/claude-kb#181, part of roadmap #167) by an Opus 5.5 lead with Sonnet 5.5 readers.
- Docs were read as raw `.md` pages from `platform.claude.com/docs/en/…` and `code.claude.com/docs/en/…`, found through each site's `llms.txt`.
- Versions come from the npm registry (`npm view @anthropic-ai/sdk dist-tags` gives `latest: 0.135.0`, published 2026-10-15; `npm view @anthropic-ai/claude-agent-sdk dist-tags` gives `latest: 0.3.302`, published 2026-10-16; dates from `npm view <pkg> 'time[<version>]'`).
- Tested on Node 24.21.0 (WSL2) with `npm install --ignore-scripts @anthropic-ai/sdk@0.135.0 @anthropic-ai/claude-agent-sdk@0.3.302` in a scratch folder, reading the installed files only.
- No API call was made: no API key was used, so API behaviour is quoted from the docs, not tested.
- CAPI-016 to CAPI-040 were researched 2026-10-30 (FreekMencke/claude-kb#351, part A). Each page was downloaded as raw `.md` from `platform.claude.com/docs/en/…` (found through `llms.txt`) and read in full; quotes were checked against that text. No API call was made, so API and Managed Agents behaviour is quoted, not tested.
- CAPI-041 to CAPI-051 were researched 2026-11-01 (FreekMencke/claude-kb#351, part C) from `code.claude.com/docs/en/agent-sdk/` pages `session-storage`, `user-input`, `structured-outputs`, `streaming-vs-single-mode`, `todo-tracking`, `troubleshooting`, `typescript-v2-preview`, `python` and `configuration`, downloaded as raw `.md` and grepped. `examples` is a routing page and gave no entry. Nothing about SDK behaviour was run: the SDK wasn't installed; `npm view @anthropic-ai/claude-agent-sdk dist-tags` gave `latest: 0.3.316`. Local Claude Code was 2.1.296.
- CAPI-052 to CAPI-073 were researched 2026-11-01 (FreekMencke/claude-kb#351, part D), by an Opus 5.5 lead with three Sonnet 5.5 readers, from raw `.md` pages; every quote and figure was then looked up in those files. `managed-agents/` pages `onboarding` and `quickstart` gave nothing new. `agent-sdk/typescript.md` (329 KB) was grepped, not read. No API call was made and the SDK wasn't run, so all of it is quoted, not tested. Inference hooks were read and left out: they are Claude Enterprise only ("Inference hooks are available only to Claude Enterprise organizations"). `release-notes/system-prompts/*` gets no entry unless a claim needs one.
- None of our public repos (osrs-tracker-web, osrs-tracker-api, freek-mencke-web, claude-skills) depends on `@anthropic-ai/sdk` or the Agent SDK. Checked 2026-10-17 with a grep of their `package.json` files and workflows.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Which request settings return 400 on the 5.5 models? | `budget_tokens`, non-default `temperature`/`top_p`/`top_k`, assistant prefill and `computer_20251124` (API and Google Cloud) on all of them. Forced `tool_choice` (`any`, `tool`) on Opus 5.5, Sonnet 5.5 and Fable 5.1. `thinking: disabled` on Opus 5.5, Sonnet 5.5 and Fable 5.1. Editing history before a replayed thinking block (accounts created on or after 2026-08-31). | CAPI-001, CAPI-002 |
| How do I force a tool call on Opus 5.5 or Sonnet 5.5? | You can't: use `tool_choice: auto`, say in the user turn when to call it, and mark the tool `strict: true`, or use structured outputs for a JSON answer. Haiku 5.5 still accepts forced tool choice, but then skips thinking. | CAPI-004 |
| Can I turn thinking off? | Haiku 5.5 and Opus 5: `disabled` at `high` effort or below. Sonnet 5.5: `between_tools` (up-front thinking off; `xhigh` and `max` return 400). Opus 5.5 and Fable 5.1: no, lower the effort instead. Check `capabilities.thinking.types.disabled` in the Models API. To show progress between tool calls use `display: "updates"` (beta `thinking-display-updates-2026-08-18`). | CAPI-001, CAPI-003, CAPI-019, CAPI-020 |
| Is a dateless ID like `claude-sonnet-5-5` an alias, and which models retire next? | No: from the 4.6 generation on a dateless ID is a pinned snapshot; only older models have aliases that point to the latest dated snapshot. Sonnet 4.5 (`claude-sonnet-4-5-20250929`) retires 2026-11-30, replacement `claude-sonnet-5-5`. The deprecations page lists every date, with at least 60 days' notice; the Console's Usage export shows which keys still call a model. | CAPI-003 |
| What limits do strict tools and structured outputs have, and what isn't guaranteed? | 20 strict tools, 24 optional parameters and 16 union-typed parameters per request in total; no recursive schemas or numeric and string-length constraints; a 180-second compile timeout. Listed as stable on Amazon Bedrock; whether every Bedrock model accepts `strict` is unverified. Output isn't guaranteed on `stop_reason: refusal` or `max_tokens`, an enum can come back in another capitalisation, and it returns 400 with citations and can't be combined with prefill. | CAPI-004, CAPI-005 |
| Which stop reasons must my code handle? | `end_turn`, `max_tokens`, `stop_sequence`, `tool_use`, `pause_turn` (server tools), `refusal` (HTTP 200, read `stop_details`) and `model_context_window_exceeded`. | CAPI-008 |
| Does the TypeScript SDK retry, and when must I stream? | 2 retries by default (connection errors, 408, 409, 429, 5xx) and a 10-minute timeout. It throws on a non-streaming request expected to run past about 10 minutes: stream, and call `stream.finalMessage()` if you only want the whole message. | CAPI-009 |
| When is a Managed Agents session done, and how do I recover a dropped stream? | `session.status_idle` with `end_turn`, and with workflow runs only after each run's `workflow_run.status_ended` plus a later idle. Interrupts also give `end_turn`. Open the stream first; to reconnect, open a new one, list history and skip seen IDs. | CAPI-060, CAPI-062, CAPI-067 |
| How do I resume an Agent SDK session on another host, and what goes wrong? | Pass a `SessionStore` (`append` and `load` required) plus `resume` from the same `cwd`. The store mirrors local disk; a store-resumed run deletes its local copy. It throws with `persistSession: false` or file checkpointing, `Not logged in` follows a temp `CLAUDE_CONFIG_DIR` (Python drops `apiKeyHelper`), and lost batches only show as `mirror_error`. | CAPI-041, CAPI-042 |
| Agent SDK, `claude -p`, a Managed Agents deployment or a routine? | `claude -p --bare` with `--max-turns` and `--max-budget-usd` for one prompt in a script; the Agent SDK for a Node service that needs `canUseTool`, hook callbacks, in-process tools or a session store (same binary). For scheduled repo upkeep, a routine on a subscription (1-hour minimum); a deployment when you need minute-level cron, a hard USD cap per run or secrets the model never sees (API tokens plus $0.08 per running session-hour). | CAPI-011, CAPI-012, CAPI-013, CAPI-014 |
| Why is my Agent SDK result `success` but empty, or an error? | `subtype: "success"` can carry `is_error` (a refusal, an API error) or no `structured_output`; check `stop_reason`, then `terminal_reason`, then `subtype`. Structured output is draft-07 JSON Schema and fails with `error_max_structured_output_retries`. `canUseTool` never fires for auto-approved tools; task tools are off on newer models. | CAPI-045, CAPI-051, CAPI-043, CAPI-048 |
| How do I change instructions, tools or effort mid-conversation, and which models read each other's thinking? | Append a `role: "system"` message, `tool_addition`/`tool_removal` blocks (beta `inline-tools-2026-09-15`) or a per-message `output_config`; never edit `system`, `tools` or earlier messages. On Fable 5.1, Mythos 5.1, Opus 5.5, Sonnet 5.5 and Haiku 5.5 a replayed thinking block then fails the prefix check (400 on accounts created on or after 2026-08-31). Fable 5.1 reads Opus 5.5 but nobody reads Fable's blocks; unreadable blocks are dropped with a 200. | CAPI-016, CAPI-017, CAPI-018, CAPI-021, CAPI-022 |
| What limits does Managed Agents have? | 300 create and 1,200 read requests a minute per organization; 500 files and 500 skills a session; 20 MCP servers an agent; 25 child threads; a run has 64 working threads, 1,000 agents and 24 hours; 10 open runs; a sandbox has up to 8 GB memory and 10 GB disk. | CAPI-054 to CAPI-058, CAPI-064, CAPI-067 |
| Which Anthropic tools are current, and what do they cost and limit? | Type strings in CAPI-031. Tool-use system prompt 286 tokens on Opus 5.5, Sonnet 5.5, Haiku 5.5; bash 325, text editor 974, computer use about 4,500, browser use about 6,600. Tool search: 10,000 deferred tools. Advisor: beta `advisor-tool-2026-03-01`. Code execution: no internet, 30-day container, free with web search or fetch, else 1,550 free hours then $0.05 an hour. | CAPI-026, CAPI-028, CAPI-031, CAPI-032, CAPI-033 |
| How do I run a Managed Agents agent safely? | `limited` networking, secrets in vaults, domain allowlists on web tools, `auto` or `always_ask` on risky tools (agent toolset default `always_allow`, MCP default `always_ask`), the smallest tool set, a budget, no untrusted input next to a powerful tool. `auto` is not a human checkpoint. | CAPI-038, CAPI-039, CAPI-040 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| CAPI-001 | Request settings that return 400 on the 5.x models | fact | api, breaking-changes, thinking, tool-choice, sampling, prefill |
| CAPI-002 | Thinking blocks in responses: read by type, pass back, keep history append-only | fact | api, thinking, preserved-thinking, migration |
| CAPI-003 | Model IDs are pinned snapshots; the retirement schedule and how to check it | fact | api, model-ids, deprecations, retirement, models-api |
| CAPI-004 | Replace forced tool use with `auto` plus strict tools; strict-tool limits | recommendation | api, tool-choice, strict-tool-use, json-schema |
| CAPI-005 | Structured outputs: what isn't guaranteed and what they don't combine with | fact | api, structured-outputs, refusals, citations |
| CAPI-006 | The SDK tool runner, and returning parallel tool results | tool | api, tool-runner, parallel-tool-use, typescript-sdk |
| CAPI-007 | Programmatic tool calling: when it pays off and its constraints | tool | api, programmatic-tool-calling, code-execution |
| CAPI-008 | Stop reasons and refusals an app must handle | fact | api, stop-reason, refusals, fallback |
| CAPI-009 | TypeScript SDK: retries, timeouts, streaming and request size | fact | typescript-sdk, retries, timeouts, streaming, errors |
| CAPI-010 | Files API, citations and Batch for a small app | comparison | api, files-api, citations, batch |
| CAPI-011 | Agent SDK or `claude -p`, and what the SDK installs | comparison | agent-sdk, headless, auth, versioning |
| CAPI-012 | Agent SDK permission order and hook callbacks | fact | agent-sdk, permissions, can-use-tool, hooks |
| CAPI-013 | Managed Agents scheduled deployments, budgets, vaults and webhooks | fact | managed-agents, scheduled-deployments, budgets, vaults, webhooks |
| CAPI-014 | Scheduled agent work: Managed Agents deployment or Claude Code scheduled task (formerly routine) | comparison | managed-agents, routines, schedule, cost, secrets |
| CAPI-015 | Evaluating an LLM feature: success criteria, test sets and graders | recommendation | evals, graders, testing, llm-judge |
| CAPI-016 | Preserved thinking: the prefix check and what happens to a failing block | fact | api, thinking, preserved-thinking, block-binding |
| CAPI-017 | Edits that keep or break thinking blocks, and the replacement for each | recommendation | api, thinking, preserved-thinking, append-only |
| CAPI-018 | Which models read which models' thinking blocks | fact | api, thinking, model-switch, fallback |
| CAPI-019 | Turning thinking off: effort limits and per-message effort | fact | api, thinking, effort, between-tools |
| CAPI-020 | Progress updates between tool calls: `display: "updates"` | fact | api, thinking, progress-updates, streaming |
| CAPI-021 | Mid-conversation system messages: where they go and what they can't do | fact | api, system-messages, caching, turn-scoped |
| CAPI-022 | Mid-conversation tool changes: `tool_addition`, `tool_removal` and inline definitions | fact | api, tool-changes, inline-tools, caching |
| CAPI-023 | On-demand compaction: request, swap and error handling | fact | api, compaction, beta |
| CAPI-024 | Compaction: which mode, and what a summary can't carry | comparison | api, compaction, context |
| CAPI-025 | Keep-tail and background compaction: keeping thinking valid | pattern | api, compaction, preserved-thinking |
| CAPI-026 | Tool search tool in the API: variants, `defer_loading` and limits | tool | api, tool-search, defer-loading |
| CAPI-027 | Caching tool definitions: where the breakpoint goes and what invalidates it | fact | api, caching, tools, cache-control |
| CAPI-028 | The advisor tool: parameters, results, caching and caps | tool | api, advisor, server-tools, beta |
| CAPI-029 | Server tools next to client tools: mixed turns, `pause_turn` and `allowed_callers` | fact | api, server-tools, pause-turn, zdr |
| CAPI-030 | Tool-use request errors: symptom, cause and fix | pattern | api, tool-use, errors, troubleshooting |
| CAPI-031 | Anthropic tool type strings, versions and shared tool properties | fact | api, tool-types, versions, client-toolsets |
| CAPI-032 | Code execution tool: versions, container limits and billing | fact | api, code-execution, container, pricing |
| CAPI-033 | Token overhead each tool adds to a request | fact | api, tokens, tool-use, overhead |
| CAPI-034 | Browser and computer use toolsets: loop contract and security | fact | api, browser-use, computer-use, security |
| CAPI-035 | Four levers for tool context, and Anthropic's tool pairings | pattern | api, context, tools, combinations |
| CAPI-036 | Managed Agents sessions: seeding, per-session overrides and budgets | fact | managed-agents, sessions, overrides, budgets |
| CAPI-037 | Managed Agents built-in tools, custom tools and web tool restrictions | fact | managed-agents, tools, web-fetch, domains |
| CAPI-038 | Managed Agents permission policies: `always_allow`, `always_ask` and `auto` | fact | managed-agents, permissions, auto |
| CAPI-039 | Securing a Managed Agents deployment: the settings, in order | recommendation | managed-agents, security, networking, vaults |
| CAPI-040 | Managed Agents: untrusted input, sandbox boundaries and stopping a session | pattern | managed-agents, security, prompt-injection, monitoring |
| CAPI-041 | SessionStore: the two required methods and how resume uses them | fact | agent-sdk, session-store, resume, persistence |
| CAPI-042 | SessionStore traps: option conflicts, auth in the temp config dir, lost batches | anti-pattern | agent-sdk, session-store, auth, retention |
| CAPI-043 | canUseTool: when it fires, what to return and how to wait for a slow human | fact | agent-sdk, can-use-tool, approvals, defer |
| CAPI-044 | AskUserQuestion in the SDK: your callback answers, with limits | fact | agent-sdk, ask-user-question, tools, subagents |
| CAPI-045 | Structured outputs in the Agent SDK: draft-07, retries and the silent-success case | fact | agent-sdk, structured-outputs, json-schema, errors |
| CAPI-046 | Streaming input versus single-message input, and the V2 session API that is gone | comparison | agent-sdk, streaming-input, v2-removed, errors |
| CAPI-047 | Python SDK differs from TypeScript: query() versus ClaudeSDKClient and other traps | comparison | agent-sdk, python, claude-sdk-client, sandbox |
| CAPI-048 | Todo and Task tools in the SDK are off on newer models | fact | agent-sdk, todo, task-tools, opt-in |
| CAPI-049 | SDK start-up and exit errors: message, cause, fix | pattern | agent-sdk, troubleshooting, cli-not-found, errors |
| CAPI-050 | Agent SDK options: caps, environment, fallback and mid-session switches | fact | agent-sdk, options, max-turns, fallback-model, env |
| CAPI-051 | ResultMessage: a "success" result can still be an error | fact | agent-sdk, result-message, stop-reason, usage |
| CAPI-052 | Managed Agents agent updates: versions, the 409 and which fields replace or merge | fact | managed-agents, versioning, agents, optimistic-concurrency |
| CAPI-053 | Managed Agents environments: packages, `allowed_hosts` matching and lifecycle | fact | managed-agents, environments, packages, allowed-hosts, networking |
| CAPI-054 | Managed Agents cloud sandbox: what's preinstalled and the limits | fact | managed-agents, sandbox, runtimes, limits, self-hosted |
| CAPI-055 | Managed Agents session files: mount paths, outputs and the 500-file cap | fact | managed-agents, files, mount-path, outputs |
| CAPI-056 | Managed Agents skills: pinning, the 500 cap and repository discovery | fact | managed-agents, skills, versions, github-repository |
| CAPI-057 | Managed Agents MCP connector: declaring servers, credential matching and failures | fact | managed-agents, mcp, vaults, session-error |
| CAPI-058 | Managed Agents API rate limits, and what the reference doesn't cap | fact | managed-agents, rate-limits, branding |
| CAPI-059 | Moving to Managed Agents: what each Agent SDK feature becomes | comparison | managed-agents, agent-sdk, migration, plan-mode, max-turns |
| CAPI-060 | Managed Agents event stream: opening order and reconnecting | pattern | managed-agents, streaming, reconnect, events |
| CAPI-061 | Managed Agents event deltas: opting in and rebuilding previews | fact | managed-agents, event-deltas, streaming, previews |
| CAPI-062 | Managed Agents: when is a session done, and what to answer while it waits | pattern | managed-agents, stop-reason, idle, end-turn, workflow-runs |
| CAPI-063 | Managed Agents session lifecycle: mid-session changes, archive and delete | fact | managed-agents, sessions, archive, delete, system-message |
| CAPI-064 | Managed Agents session threads: streams, interrupts and answering a subagent | fact | managed-agents, threads, multiagent, interrupt |
| CAPI-065 | Managed Agents outcomes: `user.define_outcome`, the grader and results | fact | managed-agents, outcomes, rubric, grader, max-iterations |
| CAPI-066 | Managed Agents usage fields: list cost, active seconds and the session viewer | fact | managed-agents, usage, list-cost, active-seconds, observability |
| CAPI-067 | Managed Agents workflow runs: limits, results and how to stop one | fact | managed-agents, workflow-runs, dynamic-workflows, limits |
| CAPI-068 | Agent SDK partial-message streaming: what doesn't arrive and in what order | anti-pattern | agent-sdk, streaming, include-partial-messages, subagents |
| CAPI-069 | Agent SDK TypeScript options the other entries don't cover | fact | agent-sdk, options, task-budget, typescript |
| CAPI-070 | Claude API OpenTelemetry: the two switches, span names and prompt content | fact | opentelemetry, tracing, spans, api, content |
| CAPI-071 | API trace delivery and counting tokens from spans | fact | opentelemetry, delivery, tokens, destinations |
| CAPI-072 | Rate Limits API: reading limits and overriding them per workspace | fact | rate-limits, admin-api, workspaces |
| CAPI-073 | MCP tunnels: private MCP servers without inbound ports | comparison | mcp-tunnels, mcp, cloudflare, private-network |

---

## Breaking changes and model lifecycle

## [CAPI-001] Request settings that return 400 on the 5.x models
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Thinking](https://platform.claude.com/docs/en/build-with-claude/thinking), [Define tools: forcing tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools), [Model deprecations: API parameter deprecations](https://platform.claude.com/docs/en/about-claude/model-deprecations), [Haiku 5.5 migration guide](https://platform.claude.com/docs/en/models/haiku-5-5/migration-guide), [Sonnet 5.5 migration guide](https://platform.claude.com/docs/en/models/sonnet-5-5/migration-guide), [Advisor tool: model compatibility](https://platform.claude.com/docs/en/agents-and-tools/tool-use/advisor-tool), [Opus 5.5 migration guide](https://platform.claude.com/docs/en/models/opus-5-5/migration-guide), [Release notes](https://platform.claude.com/docs/en/release-notes/overview), [What's new in Claude Opus 5.5](https://platform.claude.com/docs/en/models/opus-5-5/whats-new-opus-5-5), [What's new in Claude Sonnet 5.5](https://platform.claude.com/docs/en/models/sonnet-5-5/whats-new-sonnet-5-5), [What's new in Claude Haiku 5.5](https://platform.claude.com/docs/en/models/haiku-5-5/whats-new-haiku-5-5), [What's new in Claude Fable 5.1](https://platform.claude.com/docs/en/models/fable-5-1/whats-new-fable-5-1)
- Related: PROMPT-002, ORCH-028, CAPI-002, CAPI-004, CAPI-019, CAPI-028

Code written for a 4.x model or Sonnet 5 can fail on current models with `invalid_request_error` (thinking page's table, define-tools, migration guides):

| Setting | Opus 5.5 | Sonnet 5.5 | Haiku 5.5 | Fable 5.1 |
|---|---|---|---|---|
| `thinking: {type: "enabled", budget_tokens}` | 400 | 400 | 400 | 400 |
| `thinking: {type: "disabled"}` | 400 | 400 (send `between_tools`) | OK at `high` effort or below | 400 |
| `tool_choice` `any` or `tool` | 400 | 400 | OK, no thinking before the call | 400 |
| Non-default `temperature`/`top_p`/`top_k` | 400 | 400 | 400 | 400 |
| Final assistant turn (prefill) | 400 | 400 | 400 | 400 |

On Claude 4.7 and later models and Mythos Preview "the `top_p` default is `0.99`", so `top_p: 1` and both `temperature` and `top_p` return 400. From API version `2026-10-21`, setting any of `temperature`, `top_p` or `top_k` returns 400 on every model. On the Claude API and Google Cloud, computer use needs `computer_toolset_20260801`: Opus and Sonnet 5.5 reject `computer_20251124`, and Haiku 5.5 rejects `computer_20250124`.

The advisor tool's pairs depend on the executor: the advisor must be at least as capable (an Opus 5.5 executor rejects a Sonnet 5.5 advisor). For a Sonnet 5.5 executor the 2026-09-28 release note says it "rejects Claude Opus 4.8, Claude Opus 4.7, and Claude Sonnet 5 as advisors"; the migration guide's fuller list adds Opus 4.6, Sonnet 4.6 and Haiku 5.5 (400 error). It accepts only Opus 5/5.5, Sonnet 5.5, Fable 5/5.1, Mythos 5/5.1.

Release notes: Sonnet 5 code "can break on Claude Sonnet 5.5 in five ways" (2026-09-28); Haiku 4.5 code "can break on Claude Haiku 5.5" (2026-10-07). `/claude-api migrate this project to <model>` applies the swaps.

## [CAPI-002] Thinking blocks in responses: read by type, pass back, keep history append-only
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Sonnet 5.5 migration guide](https://platform.claude.com/docs/en/models/sonnet-5-5/migration-guide), [Haiku 5.5 migration guide](https://platform.claude.com/docs/en/models/haiku-5-5/migration-guide), [Fable 5.1 migration guide](https://platform.claude.com/docs/en/models/fable-5-1/migration-guide), [What's new in Claude Opus 5.5](https://platform.claude.com/docs/en/models/opus-5-5/whats-new-opus-5-5), [What's new in Claude Sonnet 5.5](https://platform.claude.com/docs/en/models/sonnet-5-5/whats-new-sonnet-5-5), [What's new in Claude Haiku 5.5](https://platform.claude.com/docs/en/models/haiku-5-5/whats-new-haiku-5-5)
- Related: CAPI-001, PROMPT-002, TOK-050, CAPI-016, CAPI-018, CAPI-020

All four current models think by default when the request has no `thinking` field, which changes what a response looks like:
- **Read blocks by `type`.** A response "can start with `thinking` blocks, so code that reads `content[0].text` breaks." Thinking text is empty by default (`display: "omitted"`); set `display: "summarized"` to get it.
- **Raise `max_tokens`.** "Thinking tokens count toward `max_tokens`", so a small limit can stop "after a `thinking` block and before any text". For Opus 5.5 at `xhigh` or `max`, the guide says to start at 64k.
- **Pass thinking blocks back unchanged** in tool loops, empty ones included.
- **Keep history append-only.** On Sonnet 5.5, Haiku 5.5 and Fable 5.1, a block is signed over everything before it. For accounts created on or after 2026-08-31 00:00 UTC, replaying one after a change to `system`, `tools` or earlier messages returns 400. Change instructions with mid-conversation `role: "system"` messages instead.
- **Thinking is account-bound.** Blocks from Haiku 5.5 and Sonnet 5.5 work only in the producing (or a linked) account; elsewhere "the API drops the block" and the request still succeeds.
- **Model switches drop blocks** the target can't read, with a 200 response.
- **Sonnet 5.5's notes between tool calls** come back as `thinking` blocks, so an interface that showed them "goes quiet" until you set `display`.

Haiku 5.5 counts the same text as about 30% more tokens than Haiku 4.5: recount before reusing limits.

## [CAPI-003] Model IDs are pinned snapshots; the retirement schedule and how to check it
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Model IDs and versioning](https://platform.claude.com/docs/en/about-claude/models/model-ids-and-versions), [Model deprecations](https://platform.claude.com/docs/en/about-claude/model-deprecations), [Models overview: Using the Models API](https://platform.claude.com/docs/en/models/overview), [Release notes](https://platform.claude.com/docs/en/release-notes/overview)
- Related: ORCH-026, ORCH-031

**IDs.** From the 4.6 generation on, IDs are dateless (`claude-{name}-{major}[-{minor}]`), and "the dateless ID is the canonical model ID for that release. It maps to a single, fixed model snapshot." Only older models have aliases (`claude-sonnet-4-5`) that resolve "to the most recent dated snapshot". Weights stay fixed, but serving infrastructure can change observable behaviour.

**Schedule** (deprecations page, 2026-10-17):
- `claude-sonnet-4-5-20250929` was deprecated 2026-09-30 and retires 2026-11-30; the replacement is `claude-sonnet-5-5`.
- Opus 4.1 retired 2026-08-05; Sonnet 4 and Opus 4 retired 2026-06-15.
- `claude-haiku-4-5-20251001` is Active, "Not sooner than October 15, 2026": that date has passed with no deprecation notice.
- The 5.5 models: "Not sooner than" 2027-09-22 (Opus), 2027-09-28 (Sonnet) and 2027-10-07 (Haiku).

Anthropic gives "at least 60 days' notice" by email. These dates cover the Claude API, Claude Platform on AWS and Foundry; Bedrock and Google Cloud set their own.

**How to check:**
- The deprecations page lists every date.
- Console → Usage → Export gives a CSV "broken down by API key and model".
- `GET /v1/models` returns `max_input_tokens`, `max_tokens`, `line` (added 2026-10-01) and `capabilities` (`thinking.types.disabled` from 2026-10-05, `server_tools` from 2026-10-06). Read these "instead of inferring it from the model's `id`".

## Tools and output

## [CAPI-004] Replace forced tool use with `auto` plus strict tools; strict-tool limits
- Type: recommendation
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Define tools](https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools), [Strict tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/strict-tool-use), [Structured outputs: schema complexity limits](https://platform.claude.com/docs/en/build-with-claude/structured-outputs), [Fable 5.1 migration guide](https://platform.claude.com/docs/en/models/fable-5-1/migration-guide)
- Related: CAPI-001, CAPI-005, CAPI-007

Opus 5.5, Sonnet 5.5 and Fable 5.1 return 400 ("tool_choice: type "tool" and "any" are not supported for this model.") for forced tool choice. The docs' replacement:
- Use `{type: "auto"}` "with an explicit instruction and `strict: true` tools, or use JSON outputs".
- Put the instruction in the user turn, or in a mid-conversation `role: "system"` message "when your application requires the call" (Fable 5.1 guide).
- Bedrock: the structured-outputs and strict-tool-use pages list Amazon Bedrock as stable; whether every Bedrock model accepts `strict` is unverified.

`strict: true` makes the `input` "strictly follows the `input_schema`", with a valid tool `name`, through grammar-constrained sampling.

Its limits, shared with `output_config.format` and counted across the whole request:

| Limit | Value |
|---|---|
| Strict tools per request | 20 |
| Optional parameters | 24 |
| Parameters with union types (`anyOf`, `["string","null"]`) | 16 |
| Compilation timeout | 180 seconds |

Unsupported schema features: recursive schemas, external `$ref`, `minimum`/`maximum`/`multipleOf`, `minLength`/`maxLength`, `minItems` other than 0 or 1, and `additionalProperties` other than `false`. Over the hidden size limits the API returns "Schema is too complex for compilation."

The first request with a schema pays compile latency. Compiled grammars are cached "for 24 hours from last use" and survive `name`/`description` edits. Each optional parameter "roughly doubles a portion of the grammar's state space", so make parameters `required` where a default exists. Toolset entries (computer and browser use) reject `strict`.

## [CAPI-005] Structured outputs: what isn't guaranteed and what they don't combine with
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs), [Citations](https://platform.claude.com/docs/en/build-with-claude/citations), [Programmatic tool calling](https://platform.claude.com/docs/en/agents-and-tools/tool-use/programmatic-tool-calling)
- Related: CAPI-004, CAPI-008, CAPI-010, PROMPT-011

JSON outputs (`output_config.format`) are GA with no beta header; the page's platform list shows them as stable on the Claude API, Claude Platform on AWS, both Google Cloud variants, Amazon Bedrock, Amazon Bedrock (InvokeModel) and Microsoft Foundry.

The deprecated `output_format` now needs the `structured-outputs-2025-11-13` header, or it returns 400.

Not guaranteed:
- **Refusals:** "The output might not match your schema because the refusal message takes precedence over schema constraints." A property that asks for step-by-step reasoning "might lead to a `reasoning_extraction` refusal".
- **`max_tokens`:** truncated output; "Retry with a higher `max_tokens` value".
- **Enum case:** a value can differ from the enum in capitalisation "with no error and no special `stop_reason`": compare case-insensitively.
- **Property order:** "required properties appear first, followed by optional properties".

Incompatible:
- Citations on any document with `output_config.format` returns 400.
- Message prefill.
- Strict tools aren't supported with programmatic tool calling.

The format adds an injected system prompt (more input tokens), and changing it invalidates the prompt cache. Validate with the SDK helpers in TypeScript: `zodOutputFormat()` (helpers in `@anthropic-ai/sdk@0.135.0`, which peers `zod ^3.25.0 || ^4.0.0` as optional; tested by reading the installed files 2026-10-17, Node 24.21.0).

## [CAPI-006] The SDK tool runner, and returning parallel tool results
- Type: tool
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Tool runner](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-runner), [Parallel tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/parallel-tool-use), [Handling stop reasons](https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons)
- Related: CAPI-007, CAPI-008, MCP-024

**Tool runner.** "The tool runner is in beta" in the Python, TypeScript, C#, Go, Java, PHP and Ruby SDKs. It runs tools when Claude calls them, manages the conversation and validates inputs.

In TypeScript you define tools with `betaZodTool()` ("requires Zod 3.25.0 or higher") or `betaTool()` (JSON Schema), and call `client.beta.messages.toolRunner(...)`. The runner "loops until Claude returns a message without a tool use, or until it reaches `max_iterations`".

The docs: "When you need human-in-the-loop approval, custom logging, or conditional execution, use the manual loop instead." The TypeScript runner's client-side compaction is deprecated in favour of server-side compaction (`context_management`).

Tested 2026-10-17, `@anthropic-ai/sdk@0.135.0`, Node 24.21.0: `toolRunner` is declared on the beta messages resource, and `betaZodTool` is exported from `helpers/beta/zod`.

**Parallel calls.** Parallel tool use "is on by default"; turn it off with `disable_parallel_tool_use: true` inside `tool_choice`, not at the top level. Execution order is yours: run independent read-only calls concurrently, and run tools with side effects in sequence. Two formatting rules keep it working:
- Every tool result goes back "in a single user message".
- No text goes before the tool results in that message.

A separate message per result "teaches" Claude to stop calling in parallel. Text after tool results is also a cause of empty `end_turn` responses (CAPI-008).

## [CAPI-007] Programmatic tool calling: when it pays off and its constraints
- Type: tool
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Programmatic tool calling](https://platform.claude.com/docs/en/agents-and-tools/tool-use/programmatic-tool-calling), [Models overview: Using the Models API](https://platform.claude.com/docs/en/models/overview)
- Related: CAPI-004, CAPI-006, TOK-054

Programmatic tool calling (GA) lets Claude write code in the code-execution container that calls your tools. The calls skip model round trips, and results are filtered before they reach the context.

**Setup:**
- The code execution tool at `code_execution_20260120` or later.
- `allowed_callers: ["code_execution_20260120"]` on each tool. Pick one caller per tool, `["direct"]` or the code-execution one, not both.
- Supported on all current models except Haiku 4.5. Check `capabilities.code_execution.supported` in the Models API, not `server_tools.code_execution`.
- It is not ZDR-eligible.

**Fit** (the docs' list):
- Strong: fan-out over many items ("checking 50 endpoints"), large results to filter or aggregate, agentic search.
- Weak: strictly sequential calls that need Claude's reasoning in between, a few small calls (container overhead can exceed the savings), and tools that need user feedback between calls.
- "If you are unsure, measure billed input tokens with and without `allowed_callers`."

**Constraints:**
- Not with `strict: true` tools.
- Not forced through `tool_choice`.
- Not with `disable_parallel_tool_use: true`.
- Not for tools with a recursive `$ref` schema.
- The reply carrying your result must contain only `tool_result` blocks and must pass the `container` ID back.
- A pending call times out "after about 4 minutes", and idle containers are reclaimed "after about 5 minutes".
- `allowed_callers` "is not a hard API-level block on direct calls": still handle a direct `tool_use`.

## [CAPI-008] Stop reasons and refusals an app must handle
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Handling stop reasons](https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons), [Refusals and fallback](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback), [Release notes 2026-09-24](https://platform.claude.com/docs/en/release-notes/overview)
- Related: CAPI-005, CAPI-009, PROMPT-011

| `stop_reason` | Meaning | Do |
|---|---|---|
| `end_turn` | Finished | Use it. An empty 2–3-token reply usually means text was added after tool results. |
| `max_tokens` | Hit your limit | Raise it or continue. A cut-off `tool_use` block needs a retry with more tokens. |
| `stop_sequence` | One of your sequences | Read `stop_sequence`. |
| `tool_use` | Calling your tool | Run it, return the result. |
| `pause_turn` | Server-tool loop hit its limit (default 10 iterations) | Send the content back as is. |
| `refusal` | Declined, as an HTTP 200 | Read `stop_details.category`. |
| `model_context_window_exceeded` | Filled the context window | Treat as truncated. |

When streaming, `stop_reason` arrives only in `message_delta`.

**Refusal categories** are `cyber`, `bio`, `frontier_llm`, `reasoning_extraction` and `general_harms`. Since 2026-09-24, a refusal before any output is billed for `bio`, `frontier_llm` and `reasoning_extraction`; other categories are not billed.

**Fallback.** Server-side fallback (`fallbacks: "default"`, header `server-side-fallback-2026-07-01`) is in beta on the Claude API and on Claude Models on Google Cloud (Anthropic managed), and not in Batch. "Claude Haiku 5.5 has no server-side fallback": use the SDK's client-side fallback or your own retry.

## [CAPI-009] TypeScript SDK: retries, timeouts, streaming and request size
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [TypeScript SDK](https://platform.claude.com/docs/en/cli-sdks-libraries/sdks/typescript), [Errors](https://platform.claude.com/docs/en/api/errors), [Streaming](https://platform.claude.com/docs/en/build-with-claude/streaming)
- Related: CAPI-008, TOK-054

**Retries.** Connection errors, 408, 409, 429 and >=500 "are all retried by default", "2 times by default, with a short exponential backoff", honouring `retry-after`. Set `maxRetries` to change it. A 429 caused by a usage tier's monthly spend cap "has no `retry-after` header and keeps failing until access resumes": don't let it retry forever. Sudden traffic growth can hit "acceleration limits", so ramp up gradually.

**Timeouts.** "By default requests time out after 10 minutes". The SDK "throws an error if a non-streaming request is expected to be above roughly 10 minutes long", which a large `max_tokens` triggers. Timed-out requests are retried twice too. Fixes:
- Stream, and use `stream.finalMessage()` to get the complete `Message` without handling events.
- Or use Batch for work that can wait.

Tested 2026-10-17, `@anthropic-ai/sdk@0.135.0`: `client.d.ts` documents `timeout=10 minutes` and `maxRetries=2`.

**Mid-stream errors.** An error such as `overloaded_error` (HTTP 529 when not streaming) can arrive as an event "after the API returns a 200 response". Resuming an interrupted stream is documented "for Claude 4.5 models and earlier" only.

**Request size.** Messages and token counting: 128 MB on the first-party Claude API (raised from 32 MB on 2026-10-28); Bedrock 20 MB, Google Cloud (Google managed) 30 MB, Claude Platform on AWS, Google Cloud (Anthropic managed) and Foundry 32 MB. Batch: 256 MB. Files: 500 MB.

## [CAPI-010] Files API, citations and Batch for a small app
- Type: comparison
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Files API](https://platform.claude.com/docs/en/build-with-claude/files), [Citations](https://platform.claude.com/docs/en/build-with-claude/citations), [Batch processing](https://platform.claude.com/docs/en/build-with-claude/batch-processing)
- Related: TOK-054, CAPI-005, CAPI-007

| | Files API | Citations | Batch |
|---|---|---|---|
| Status | GA, no beta header (`files-api-2025-04-14` optional) | GA, all active models | GA (TOK-054) |
| Platforms | Claude API, Claude Platform on AWS, Google Cloud (Anthropic managed), Foundry (hosted on Anthropic) | Claude API, Claude Platform on AWS, Amazon Bedrock (both), Google Cloud (Google managed), Foundry | See TOK-054 |
| Cost | Upload, download, list and delete "are free"; content is billed as input tokens | Slightly more input; `cited_text` "does not count toward output tokens" | 50% off |
| Limits | 500 MB per file, 1 TB per organisation, about 500 file requests a minute | Not with structured outputs (400) | Up to 24 h |

**Files.** A file ID maps to `document` (PDF, plain text), `image` or `container_upload` (datasets for code execution). Files persist until deleted, or until `expires_in_seconds` (1 hour to 90 days) runs out. They're workspace-scoped: "never accept file IDs from untrusted sources". Files aren't ZDR-eligible.

**Citations.** Enable them per document. Plain text cites character ranges, PDFs pages, custom content blocks. Citations are "guaranteed to contain valid pointers to the provided documents", unlike prompted quotes.

**For a small app:** use Files when a document is reused across requests or feeds code execution, and inline base64 for a one-off. Use citations when users must check the source. Use Batch for anything that can wait. Whether a Batch request can reference a `file_id` isn't stated (Open questions).

## Agent SDK and Managed Agents

## [CAPI-011] Agent SDK or `claude -p`, and what the SDK installs
- Type: comparison
- Applies to: Claude Code, Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Headless](https://code.claude.com/docs/en/headless), [Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview), [Agent SDK quickstart](https://code.claude.com/docs/en/agent-sdk/quickstart), [Agent SDK TypeScript reference](https://code.claude.com/docs/en/agent-sdk/typescript), [Hosting](https://code.claude.com/docs/en/agent-sdk/hosting), [Agent SDK CHANGELOG](https://github.com/anthropics/claude-agent-sdk-typescript/blob/main/CHANGELOG.md)
- Related: ORCH-014, ORCH-015, MCP-024, MEM-028, CAPI-012

**One engine.** The headless page calls `claude -p` "the Agent SDK via the CLI". The overview calls the SDK "A library that runs the Claude Code binary". Each SDK session supervises one `claude` subprocess with a shell, a working directory and session files on disk.

**Choosing.** Stay on `claude -p` for one prompt in a script or workflow. `--bare` is "the recommended mode for scripted and SDK calls" and needs `ANTHROPIC_API_KEY`. Add `--max-turns` and `--max-budget-usd`. Move to the SDK for a long-lived Node service that needs:
- `canUseTool` approval;
- hook callbacks;
- in-process MCP tools;
- `maxBudgetUsd`;
- a `SessionStore` that moves transcripts off the local disk (default `~/.claude/projects/`).

**Auth.** The SDK reads `ANTHROPIC_API_KEY` or the Bedrock, Vertex and Foundry switches. The docs: "Unless previously approved, Anthropic does not allow third party developers to offer claude.ai login or rate limits for their products, including agents built on the Claude Agent SDK."

**What installs.** Tested 2026-10-17, `@anthropic-ai/claude-agent-sdk@0.3.302`, Node 24.21.0, with `--ignore-scripts`:
- An optional dependency `@anthropic-ai/claude-agent-sdk-linux-x64` brought a 286 MB native `claude` binary.
- `package.json` says `"claudeCodeVersion": "2.1.302"`.
- Peers: `@anthropic-ai/sdk >=0.93.0`, `@modelcontextprotocol/sdk ^1.29.0`, `zod ^4.0.0`.

The docs: "The SDK version tracks the bundled Claude Code version." So an SDK bump is a Claude Code upgrade: read its CHANGELOG. For example, 0.3.302 (2026-10-16) starts an omitted `permissionMode` in `default` on third-party providers.

## [CAPI-012] Agent SDK permission order and hook callbacks
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [SDK permissions](https://code.claude.com/docs/en/agent-sdk/permissions), [SDK hooks](https://code.claude.com/docs/en/agent-sdk/hooks), [Agent SDK TypeScript reference](https://code.claude.com/docs/en/agent-sdk/typescript)
- Related: CAPI-011, ORCH-015, HOOK-001, REPO-031

"When Claude requests a tool, the SDK checks permissions in this order":
1. **Hooks.** A hook can deny; "A hook that returns `allow` doesn't skip the deny and ask rules below".
2. **Deny rules**, which block "even in `bypassPermissions` mode".
3. **Ask rules**, which go to `canUseTool` even in `bypassPermissions`.
4. **Permission mode**: `default`, `acceptEdits`, `bypassPermissions`, `plan`, `dontAsk` or `auto`.
5. **Allow rules** (`allowedTools`, settings).
6. **`canUseTool`**, skipped in `dontAsk`, which denies instead.

The trap: `canUseTool` is "Not invoked for calls auto-approved by `allowedTools`, allow rules, or `permissionMode`". To see every call, use a `PreToolUse` hook. The SDK warns with `CLAUDE_SDK_CAN_USE_TOOL_SHADOWED` when `bypassPermissions` or a bare `allowedTools` entry makes the callback unreachable. A subagent inherits the parent's mode.

**Hooks.** The TypeScript `HookEvent` union has 33 events, the same names as the CLI's hooks page (compared by reading, not by script). Python lacks many of them, `SessionStart` and `SessionEnd` included. Callbacks return the CLI hooks' JSON shape.

Shell hooks from settings files also run, because default `query()` options load all setting sources. Since 0.3.300, `updatedInput` from `PreToolUse` and `PermissionRequest` callbacks "is now validated like Claude's own input and unknown keys are dropped".

## [CAPI-013] Managed Agents scheduled deployments, budgets, vaults and webhooks
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Scheduled deployments](https://platform.claude.com/docs/en/managed-agents/scheduled-deployments), [Budgets](https://platform.claude.com/docs/en/managed-agents/budgets), [Vaults](https://platform.claude.com/docs/en/managed-agents/vaults), [Webhooks](https://platform.claude.com/docs/en/managed-agents/webhooks), [Pricing](https://platform.claude.com/docs/en/about-claude/pricing), [Release notes](https://platform.claude.com/docs/en/release-notes/overview)
- Related: ORCH-018, MEM-031, CAPI-014

All of these are beta under `managed-agents-2026-04-01`. Managed Agents launched 2026-04-08.

**Scheduled deployments** (2026-06-09):
- A cron `expression` plus an IANA `timezone`, at minute granularity.
- Execution has jitter "of up to 15 percent of the interval between runs, with a minimum of 5 seconds and a maximum of 9 minutes".
- "A maximum of 1,000 scheduled deployments is supported for each organization."
- Each run creates a session.
- A rate-limited start is recorded as `session_rate_limited_error` "without retry".

**Budgets** (2026-08-07): a hard cap on list cost, in US cents as a string (`"125"` is $1.25). It covers tokens, web search and $0.08 per running hour. It is checked "between model requests, not mid-request", so it can overshoot. At the cap the session idles with `stop_reason: budget_reached` and isn't terminated. On a deployment, "it bounds each run separately rather than the deployment's cumulative spend".

**Vaults:**
- Workspace-scoped, "Maximum 20 credentials per vault".
- Secret values are write-only.
- An `environment_variable` credential sits in the sandbox as a placeholder "substituted with the real secret at egress. The agent never sees the secret value". Pair it with `allowed_hosts`.
- MCP credentials are injected per server URL.

**Webhooks:**
- Signed (`webhook-id`, `webhook-timestamp`, `webhook-signature`); the SDK's `unwrap()` rejects payloads older than 5 minutes.
- Payloads carry only the type and ID.
- Up to three delivery attempts; "Events aren't guaranteed to be delivered in the order they occurred".

## [CAPI-014] Scheduled agent work: Managed Agents deployment or Claude Code scheduled task (formerly routine)
- Type: comparison
- Applies to: Claude Code, Claude API
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Routines](https://code.claude.com/docs/en/routines), [Scheduled deployments](https://platform.claude.com/docs/en/managed-agents/scheduled-deployments), [Budgets](https://platform.claude.com/docs/en/managed-agents/budgets), [Pricing](https://platform.claude.com/docs/en/about-claude/pricing), [Managed Agents GitHub](https://platform.claude.com/docs/en/managed-agents/github)
- Related: ORCH-017, REPO-030, DOC-024, CAPI-013

| | Managed Agents deployment | Claude Code routine |
|---|---|---|
| Status | Beta | "research preview" |
| Billing | API tokens plus $0.08 per `running` session-hour; idle time is free | "Scheduled tasks draw down subscription usage the same way interactive sessions do" |
| Interval | Cron to the minute, with jitter | "Expressions that run more often than once per hour are rejected." |
| Count limits | 1,000 deployments per organisation | 100 scheduled runs an hour per account; 30 an hour per scheduled task, shared by **Run now**, API fires and re-running a one-off task; "None of these hourly limits has overage" |
| Spend cap per run | Hard USD `budget` | None documented; bounded by plan usage |
| Secrets | Vault: write-only, substituted at egress | Environment variables "visible to anyone who uses the environment"; connectors attached by default |
| GitHub | `github_repository` resource with a fine-grained token | Your GitHub identity, pushes to `claude/` branches |
| Owner | Workspace (API key) | "your individual claude.ai account" |

**Choosing.** Repo upkeep that should act as you, such as our weekly docs-drift check (DOC-024), fits a routine: no extra spend on a subscription, and its own examples include "Docs drift". A deployment fits work that must run more often than hourly, needs a hard spend cap per run, keeps secrets from the model, or belongs to an API product. Pricing's worked example: a one-hour Opus 5.5 session with 50k input and 15k output tokens costs $0.58.

Run outcomes "say how the session ended, not whether Claude completed the work your prompt describes, so open the run and read its transcript to see what happened."

## Evaluation

## [CAPI-015] Evaluating an LLM feature: success criteria, test sets and graders
- Type: recommendation
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Define success criteria and build evaluations](https://platform.claude.com/docs/en/test-and-evaluate/develop-tests), [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) (2026-01-09)
- Related: SKILL-025, SKILL-028, JSTEST-013, PROMPT-028

**Order.** Define measurable success criteria first, then build evals against them. The docs' principles:
1. "Be task-specific": mirror the real task distribution, with edge cases (irrelevant, overly long, harmful or ambiguous input).
2. "Automate when possible."
3. "Prioritize volume over quality: More questions with slightly lower signal automated grading is better than fewer questions with high-quality human hand-graded evals."

**Graders**, fastest and most reliable first:
1. Code: exact or string match.
2. LLM-based: "Test to ensure reliability first, then scale."
3. Human: "slow and expensive. Avoid if possible."

LLM graders need "detailed, clear rubrics" and an empirical output ("only 'correct' or 'incorrect', or … 1–5"). Run them with thinking on. The examples note the code comment reads "Generally best practice to evaluate with a different model from the one used to generate the evaluated output"

**For agents** (engineering post):
- "20-50 simple tasks drawn from real failures is a great start."
- Grade the outcome (the database row exists), not the transcript's claim. Checking an exact tool-call sequence is "too rigid": "grade what the agent produced, not the path it took."
- Report pass@k (at least one success in k tries) or pass^k (all k succeed) to fit the product: pass^k "for agents where consistency is essential".

Run evals on the target model before a migration (CAPI-001), since Anthropic advises testing replacements "well before the retirement date".

---

## Thinking blocks, system messages and compaction

## [CAPI-016] Preserved thinking: the prefix check and what happens to a failing block
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Preserved thinking](https://platform.claude.com/docs/en/build-with-claude/preserved-thinking), [Troubleshooting thinking](https://platform.claude.com/docs/en/build-with-claude/thinking-troubleshooting), [What's new in Claude Opus 5.5](https://platform.claude.com/docs/en/models/opus-5-5/whats-new-opus-5-5), [What's new in Claude Sonnet 5.5](https://platform.claude.com/docs/en/models/sonnet-5-5/whats-new-sonnet-5-5), [What's new in Claude Fable 5.1](https://platform.claude.com/docs/en/models/fable-5-1/whats-new-fable-5-1)
- Related: CAPI-002, CAPI-017, CAPI-018

Fable 5.1, Mythos 5.1, Opus 5.5, Sonnet 5.5 and Haiku 5.5 accept a replayed thinking block only while the `system` prompt, `tools` and earlier `messages` match what you sent when it was produced. The docs: "The prefix check runs on Claude 5.1 and later models. Other models don’t run it."

Set `thinking.block_binding.prefix_mismatch_behavior` (beta header `thinking-binding-controls-2026-08-01`) to choose what a failing block does:
- `"error"`: 400 `invalid_request_error` naming the first failing block.
- `"drop_block"`: the API drops it and every later thinking block, unbilled, and lists them in `input_transformations` with `reason: "prefix_binding_mismatch"`.

**Field unset.** On accounts created on or after 2026-08-31 00:00 UTC, all five models return 400. On older accounts Mythos 5.1 returns 400 and the other four let the failing block through, billed and without an error (the beta header then reports it as `thinking_mismatch_allowed`). In Message Batches an unset item drops the blocks instead of failing.

**Traps:**
- "People who run your tool with their own API keys can get a 400 error even when you don’t." Set `"error"` on test requests.
- Resending the same body fails the same way. `"drop_block"` is a stopgap: "Dropping blocks can significantly increase output tokens". Count and alert on `prefix_binding_mismatch` entries.
- On Sonnet 5.5 and Haiku 5.5, `block_binding` works only with `thinking: {"type": "adaptive"}`. With `between_tools` or `disabled` it returns 400, so strip the named block and every later thinking block.
- Server-side compaction and context editing never trigger the error.

## [CAPI-017] Edits that keep or break thinking blocks, and the replacement for each
- Type: recommendation
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Preserved thinking](https://platform.claude.com/docs/en/build-with-claude/preserved-thinking), [Mid-conversation system messages and tool changes](https://platform.claude.com/docs/en/build-with-claude/mid-conversation-system-messages)
- Related: CAPI-016, CAPI-021, CAPI-022, TOK-038

On the models that run the prefix check (CAPI-016), keep `system` and `tools` fixed for the session and treat `messages` as append-only. Send each assistant turn back exactly as returned: "A serializer that drops unknown block types, drops empty fields, or reorders blocks edits the prefix for every later turn."

**Stays valid:** appending; changing `effort`, `max_tokens`, `output_config`, `tool_choice`, `metadata` or `thinking.display`; moving `cache_control` markers; adding a tool with `defer_loading: true` that nothing has referenced; removing thinking blocks from the start, the end or all of them; server-side compaction or context editing; a model change (unreadable blocks are dropped, CAPI-018).

**Breaks every later block:** editing, reordering or deleting an earlier message; changing `system`; adding, removing, renaming or editing a tool; clearing or shortening an earlier `tool_result`; re-encoding an image; adding or removing a text block in an earlier user turn; removing a thinking block from the middle; a URL that returns different bytes.

| Instead of | Use | Beta header |
|---|---|---|
| Rebuilding `system` | A mid-conversation `role: "system"` message | none |
| A reminder you delete next turn | `clear_at: "next_user_message"` | `mid-conversation-system-clear-at-2026-08-21` |
| Editing `tools` | `tool_addition` and `tool_removal` | `inline-tools-2026-09-15` |
| Changing top-level effort | A per-message `output_config` | `mid-conversation-output-config-2026-07-01` |
| Clearing old tool results | `clear_tool_uses_20250919` | `context-management-2025-06-27` |
| Summarizing old turns | On-demand compaction | `compact-2026-09-04` |
| A URL whose bytes change | A Files API `file_id` | none |

## [CAPI-018] Which models read which models' thinking blocks
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Preserved thinking: switching models](https://platform.claude.com/docs/en/build-with-claude/preserved-thinking), [What's new in Claude Opus 5.5](https://platform.claude.com/docs/en/models/opus-5-5/whats-new-opus-5-5), [What's new in Claude Sonnet 5.5](https://platform.claude.com/docs/en/models/sonnet-5-5/whats-new-sonnet-5-5), [What's new in Claude Fable 5.1](https://platform.claude.com/docs/en/models/fable-5-1/whats-new-fable-5-1)
- Related: CAPI-002, CAPI-016

Each thinking block records the model that produced it. A model reads its own blocks and a fixed set of others'; a block it can't read is dropped before the model sees it, the request still succeeds with 200, and the block isn't billed.

| Model | Also reads blocks from | Does not read |
|---|---|---|
| Fable 5.1, Mythos 5.1 | each other and earlier Claude models; on the Claude API, Opus 5.5 | |
| Opus 5.5 | Opus 5, earlier Opus, Sonnet, Haiku; on the Claude API and Google Cloud (Google managed), Sonnet 5.5 and Haiku 5.5 | Fable, Mythos |
| Sonnet 5.5 | Sonnet 5, Opus 4.8, Haiku 4.5 and earlier; on those two platforms, Haiku 5.5 | Opus 5, Opus 5.5, Fable, Mythos |
| Haiku 5.5 | Sonnet 5, Opus 4.8, Haiku 4.5 and earlier | Opus 5, Opus 5.5, Sonnet 5.5, Fable, Mythos |

No model other than those in the first column reads Fable 5.1 or Mythos 5.1 blocks, so a router or a server-side fallback to a cheaper model runs that turn without the reasoning.

Keep sending the full history: "The API never edits your `messages` array", so the blocks are readable again when the conversation returns to the producing model. The reasoning is lost for good only if your client strips it.

With `thinking-binding-controls-2026-08-01`, the response's `input_transformations` lists drops with `reason: "model_binding_mismatch"`, or `"organization_binding_mismatch"` for the second rule: Sonnet 5.5 and Haiku 5.5 blocks work only in the producing account or an account linked to it. Without the header the drop is silent.

## [CAPI-019] Turning thinking off: effort limits and per-message effort
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Troubleshooting thinking](https://platform.claude.com/docs/en/build-with-claude/thinking-troubleshooting), [What's new in Claude Sonnet 5.5](https://platform.claude.com/docs/en/models/sonnet-5-5/whats-new-sonnet-5-5), [What's new in Claude Haiku 5.5](https://platform.claude.com/docs/en/models/haiku-5-5/whats-new-haiku-5-5), [What's new in Claude Opus 5.5](https://platform.claude.com/docs/en/models/opus-5-5/whats-new-opus-5-5)
- Related: CAPI-001, CAPI-003, TOK-055

CAPI-001 lists which models accept `disabled`. The limits on top of that:
- **Opus 5 and Haiku 5.5:** `disabled` only at `high` effort or below; `xhigh` or `max` returns 400.
- **Haiku 5.5:** with `disabled`, a per-message effort that differs from the level in effect also returns 400.
- **Sonnet 5.5:** `disabled` returns 400 at every effort level, with a message pointing to `between_tools`. `between_tools` is accepted at `low`, `medium` and `high`, returns 400 at `xhigh` or `max` and when a per-message `output_config.effort` differs from the level in effect, and takes no other field (`display`, `budget_tokens`, `block_binding`). To vary effort per turn or run at `xhigh`, omit `thinking` or send `adaptive`.
- **Opus 5.5, Fable 5.1, Mythos 5.1:** no off switch; the 400 says to use `adaptive` and `output_config.effort`.

The effort errors say `thinking is disabled` even for `between_tools`, which has no up-front thinking.

**Opus 5 with thinking disabled** can write a tool call or `<thinking>` tags into its text, most often on tool-heavy workloads; a leaked tool call never runs, and prompt rules not to think "increase the tag leakage". Keep thinking on and lower effort.

Changing the thinking mode, the effort value or `budget_tokens` invalidates message cache breakpoints; setting a parameter to its default equals omitting it. An empty `thinking` field is the default `display: "omitted"`, and the `signature` still holds the reasoning.

## [CAPI-020] Progress updates between tool calls: `display: "updates"`
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Thinking: progress updates](https://platform.claude.com/docs/en/build-with-claude/thinking), [What's new in Claude Fable 5.1](https://platform.claude.com/docs/en/models/fable-5-1/whats-new-fable-5-1), [What's new in Claude Opus 5.5](https://platform.claude.com/docs/en/models/opus-5-5/whats-new-opus-5-5), [What's new in Claude Sonnet 5.5](https://platform.claude.com/docs/en/models/sonnet-5-5/whats-new-sonnet-5-5)
- Related: CAPI-002, CAPI-019

Fable 5.1, Mythos 5.1, Opus 5.5, Sonnet 5.5 and Fable 5 can write a short note between tool calls on what they found and will do next. Each note is its own `thinking` block with its own `signature`, right before the `tool_use` block, at most one per call. At the default `display: "omitted"` it is empty, so an interface that streams the notes "goes quiet" with no error (CAPI-002).

| `display` | Reasoning blocks | Progress-update blocks |
|---|---|---|
| `"omitted"` (default) | empty | empty |
| `"updates"` (beta) | empty | summary text |
| `"summarized"` | summary text | summary text, not distinguishable from reasoning |

`"updates"` needs the beta header `thinking-display-updates-2026-08-18`; without it the value is rejected like any unknown `display`. Under it, any `thinking` block with non-empty text is a status line to show. On Sonnet 5.5, `between_tools` returns the notes with text and no up-front reasoning. At the default `display`, only notes longer than a sentence or two come back as thinking blocks there; shorter remarks stay `text`.

Details:
- Pass the blocks back unchanged: the model gets the full note, not the summary. The summary counts at full length in `usage.output_tokens`.
- A response cut off by `max_tokens` soon after a tool call can end in a block whose text is `This part of the response was interrupted before it finished.`
- Expect a pause of several seconds before a block opens when streaming, and fewer notes at higher effort and in long tool chains.

## [CAPI-021] Mid-conversation system messages: where they go and what they can't do
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Mid-conversation system messages and tool changes](https://platform.claude.com/docs/en/build-with-claude/mid-conversation-system-messages), [Preserved thinking](https://platform.claude.com/docs/en/build-with-claude/preserved-thinking)
- Related: CAPI-002, CAPI-017, CAPI-022, TOK-050

Append `{"role": "system"}` to `messages` where an instruction starts to apply, instead of editing the top-level `system` field, which changes the start of the cached prefix. It needs no beta header on Fable 5.1, Mythos 5.1, Fable 5, Mythos 5, Opus 5.5, Opus 5, Opus 4.8, Sonnet 5.5 and Haiku 5.5 on the Claude API, Amazon Bedrock and Google Cloud (Google managed); "This feature is not available on Claude Sonnet 5." In Managed Agents, send a `system.message` event.

**Priority.** A system message "is treated as coming from you, the application operator", a user message as the end user. Later system messages beat earlier ones, and beat the top-level `system` for the turns after them.

**Placement.** A message that carries content can't be first in `messages`. It must follow a `user` turn (a `tool_result` turn counts), or an assistant turn ending in a server tool result, and precede an assistant turn or end the array. Between a `tool_use` and its `tool_result` it returns 400. An empty message that only sets `output_config.effort` goes anywhere.

**Don't:**
- Put raw tool output, retrieved documents or web content in one: it gains operator authority.
- Edit or remove a sent one: that breaks the cache and, on Claude 5.1 and later models, later thinking blocks (CAPI-017).

**`clear_at: "next_user_message"`** (beta header `mid-conversation-system-clear-at-2026-08-21`) makes a per-turn reminder render only until the next user message. Resend a cleared one verbatim. Text only, no `cache_control`, no tool blocks or `output_config`.

On Sonnet 5.5 and Haiku 5.5, relay input the user typed mid-loop as a `text` block after the last `tool_result` instead.

## [CAPI-022] Mid-conversation tool changes: `tool_addition`, `tool_removal` and inline definitions
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Mid-conversation system messages and tool changes](https://platform.claude.com/docs/en/build-with-claude/mid-conversation-system-messages), [Compaction and preserved thinking](https://platform.claude.com/docs/en/build-with-claude/compaction-thinking-blocks), [What's new in Claude Opus 5.5](https://platform.claude.com/docs/en/models/opus-5-5/whats-new-opus-5-5)
- Related: CAPI-017, CAPI-021, TOK-050

The `tools` array sits before `system` in the hashed prefix, so editing it invalidates the whole cache (CAPI-027). The beta alternative keeps `tools` as sent and changes what the model is offered through content blocks in a `role: "system"` message:
- `tool_addition` and `tool_removal` name a tool by `tool_reference` (or `mcp_tool_reference`, `mcp_toolset_reference`). Every tool in `tools` is offered from the start unless it has `defer_loading: true`; `tool_addition` also re-offers a removed one. An unknown name returns 400 (`tool_reference_unresolved`).
- With `tool_definition`, the block carries the full definition, so you can add a tool the request never declared, change a schema or move a server tool to a newer version, and the cache still hits. Sending an identical definition again changes nothing. The computer use tool can't be defined this way during the beta.

Beta headers on the Claude API: `inline-tools-2026-09-15` covers references and inline definitions; adding an MCP server this way also needs `mcp-client-2026-09-15`. The older `mid-conversation-tool-changes-2026-07-01` works for references only, also on Bedrock and Google Cloud (Google managed).

Limits: the blocks aren't accepted right after a paused assistant turn (resume first), and not on a turn-scoped message (CAPI-021). Placement is the same as for any system message with content. Opus 5.5, Sonnet 5.5 and the other models in CAPI-021 take them.

A compaction request that also carries `inline-tools-2026-09-15` records the net tool changes in the returned block's `tool_changes` field, so send the block back unmodified (CAPI-025).

## [CAPI-023] On-demand compaction: request, swap and error handling
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Compaction on demand](https://platform.claude.com/docs/en/build-with-claude/compaction-on-demand), [Compaction overview](https://platform.claude.com/docs/en/build-with-claude/compaction)
- Related: TOK-038, CAPI-024, CAPI-025, CAPI-006

You send the conversation with the top-level `compaction: {"type": "summarize"}` and the beta header `compact-2026-09-04`; the response is one signed `compaction` block holding the summary, not a reply. Send it first in `messages`, in place of the messages it summarizes, on every later request, with the header.

**Rules:**
- Exactly one block per request, unchanged, `signature` included. Fields the API didn't return (`citations: null`) give a 400.
- Summarized messages still in front of it: 400 `compaction_block_misplaced`. A changed block: `compaction_signature_invalid` or `compaction_content_mismatch`.
- The last assistant turn can't end in a tool call without a result.
- Compact again by sending `compaction` again; send only the newest block.

**A failed summary is still a 200 with empty `content`**, billed. Check `stop_reason` first: `max_tokens` (raise it), `model_context_window_exceeded` (shorter `instructions` or fewer messages), `tool_use` (tell it not to call tools), `refusal` or `end_turn` (continue without a summary). 529 `compaction_unavailable`: retry.

**Cost.** The summary call shows as the `compaction` entry in `usage.iterations`; top-level tokens are zero, so sum the iterations. When to compact is your decision: add the last response's input and output tokens (plus cache read and creation tokens) and compare with your limit.

`instructions` of up to 16,384 characters replace the default prompt; the summarizer reads the whole conversation, thinking included. The SDK tool runner can send it for you with `compact_before_next_turn()`; create the runner with the beta, and use one kind of compaction per runner.

## [CAPI-024] Compaction: which mode, and what a summary can't carry
- Type: comparison
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Compaction overview](https://platform.claude.com/docs/en/build-with-claude/compaction), [Compaction on demand](https://platform.claude.com/docs/en/build-with-claude/compaction-on-demand), [Compaction at a token threshold](https://platform.claude.com/docs/en/build-with-claude/compaction-threshold)
- Related: TOK-038, CAPI-023, CAPI-025, CAPI-017

The docs: "Use on-demand compaction wherever it is available." Both server-side modes are beta.

| | On demand | At a threshold | Your own summarizer |
|---|---|---|---|
| Who decides when | You | The API, at the trigger you set | You |
| Recent turns word for word | Yes (CAPI-025) | Only by pausing after compaction and reinserting them | Yes |
| Runs in the background | Yes | No, inside the request that hits the threshold | Yes |
| Kept turns keep thinking | Yes, under conditions | No: strip it or use `prefix_mismatch_behavior: "drop_block"` | No, it fails the prefix check |
| Header | `compact-2026-09-04` | `compact-2026-01-12` | none |

On-demand platforms: Claude API, Claude Platform on AWS, Google Cloud (Google managed) and Microsoft Foundry; the listed models run from Sonnet 4.6 and Opus 4.6 up to Fable 5.1. Bedrock isn't listed.

**What the summary can't carry:**
- Images, documents, `container_upload` blocks and fetched URLs inside the summarized messages are gone: restate or re-upload what a later turn needs.
- Text instructions in summarized mid-conversation system messages stop applying, and so does a per-message effort they set. Restate them in a system message after the next new user turn.
- Don't send `output_config.task_budget.remaining` with `compaction` or on requests that carry the block: 400.
- You can't send `compaction` with `context_management`, nor with `stop_sequences`, forced `tool_choice` or a structured-output format. Token counting ignores `compaction`. `cache_control` on the block puts a breakpoint after the summary.

## [CAPI-025] Keep-tail and background compaction: keeping thinking valid
- Type: pattern
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Compaction that keeps recent turns](https://platform.claude.com/docs/en/build-with-claude/compaction-keep-recent-turns), [Compaction in the background](https://platform.claude.com/docs/en/build-with-claude/compaction-background), [Compaction and preserved thinking](https://platform.claude.com/docs/en/build-with-claude/compaction-thinking-blocks)
- Related: CAPI-023, CAPI-016, CAPI-022

Two variations on the on-demand loop (CAPI-023), both with beta `compact-2026-09-04`:

**Keep the last turns word for word.** No parameter picks them. You choose a cut point: messages before it go into the compaction request, and you send the returned block, then the kept messages unchanged, then the new user message. Cut where no tool call is open, with each call and result on the same side. The more you keep, the less room is freed.

**Background (async).** Send the request on the full history and record how many messages it held. Keep appending turns, edit nothing, and start no second request until this one is swapped in or failed. When `stop_reason` is `"compaction"`, drop exactly those messages from the front and put the returned message in their place; later turns stay after it. Start early enough that the window has room for turns that arrive meanwhile. The request counts against rate limits.

**Kept thinking stays valid only if all three hold:**
1. Every compaction request since the thinking was produced ran on a model with preserved thinking.
2. The kept turns directly follow the summarized ones, unchanged, with a different role from the last summarized message, and not starting with a system message.
3. `system` and the non-deferred `tools` stay unchanged.

Nothing fails at compaction when a condition breaks; the first later request that sends the thinking does. The simplest safe cut is exactly the `messages` of a request you already sent. To change `system` or `tools`, compact everything first. Test with `prefix_mismatch_behavior: "error"` and an empty `input_transformations` (CAPI-016).

## Anthropic's tools in the Messages API

## [CAPI-026] Tool search tool in the API: variants, `defer_loading` and limits
- Type: tool
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Tool search tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool), [Manage tool context](https://platform.claude.com/docs/en/agents-and-tools/tool-use/manage-tool-context)
- Related: TOK-020, TOK-038, CAPI-027, CAPI-031

The API's counterpart of Claude Code's MCP tool search (TOK-020). The docs: "Claude’s ability to pick the right tool degrades once you exceed 30–50 available tools."

**Two variants**, released together, neither supersedes the other: `tool_search_tool_regex_20251119` (Claude writes Python `re.search()` patterns, case-insensitive, at most 200 characters) and `tool_search_tool_bm25_20251119` (natural-language queries, at most 500). Undated aliases `tool_search_tool_regex` and `tool_search_tool_bm25` resolve to the latest.

**How:**
- Send every definition in `tools` on every request, with `defer_loading: true` on those to hold back. The API needs them to search and expand results.
- At least one tool stays non-deferred, never the search tool; keep your 3–5 most used tools loaded.
- A search returns up to 5 `tool_reference` blocks by default; Claude can set `limit` from 1 to 10,000. Up to 10,000 deferred tools per request.
- For MCP, set `defer_loading` once in the `mcp_toolset`'s `default_config`.
- You can write your own search (embeddings, say): return `tool_reference` blocks in a standard `tool_result`; each must name a tool defined in `tools`.

**When:** 10 or more tools, definitions over 10k tokens, or several MCP servers (200+ tools). With fewer than 10 tools, or definitions under 100 tokens in total, plain tool calling is better.

**Traps:** a tool with `defer_loading: true` can't carry `cache_control` (400); `All tools have defer_loading: true` means none is visible. On Bedrock it works only through InvokeModel, not Converse. It isn't metered as a separate server tool, and loaded definitions count as input tokens.

## [CAPI-027] Caching tool definitions: where the breakpoint goes and what invalidates it
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Tool use with prompt caching](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-use-with-prompt-caching), [Tool search tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool), [Manage tool context](https://platform.claude.com/docs/en/agents-and-tools/tool-use/manage-tool-context)
- Related: TOK-050, TOK-038, CAPI-022, CAPI-026

**Breakpoint.** Put `cache_control: {"type": "ephemeral"}` on the last tool in `tools`: it caches the prefix from the first tool through it. For `mcp_toolset`, put it on the toolset entry itself, since you don't control tool order inside it. The same goes for the computer and browser use toolsets: on the entry, not inside a member's `configs`.

**Deferred tools stay out of the prefix.** A tool found through tool search is appended inline as a `tool_reference`, so adding tools this way keeps the cache. Anthropic's order of adoption for a high-volume agent: cache tool definitions from the start ("Cache writes carry a 25 percent markup over base input pricing"), add tool search past roughly 20 tools, add context editing when old results stop mattering, then consider programmatic tool calling for chains of small calls.

| Change | Invalidates |
|---|---|
| Editing tool definitions | tools, system and messages |
| Toggling web search or citations | system and messages |
| Changing `tool_choice` or `disable_parallel_tool_use` | messages |
| Toggling images present or absent | messages |
| Changing thinking parameters or effort | messages, and tools and system on models that render the configuration ahead of them |

If `tool_choice` must vary, put breakpoints before the variation point.

**Server tool results are cached automatically** when the request already has at least one `cache_control` marker. That breakpoint always uses the 5-minute TTL, so `cache_creation.ephemeral_5m_input_tokens` can be non-zero even when all your markers use 1 hour.

## [CAPI-028] The advisor tool: parameters, results, caching and caps
- Type: tool
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Advisor tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/advisor-tool)
- Related: ORCH-029, CAPI-001, CAPI-027

ORCH-029 has the measured economics and CAPI-001 the model pairs. The mechanics (beta header `advisor-tool-2026-03-01`):

- **Declare** `{"type": "advisor_20260301", "name": "advisor", "model": "<advisor ID>"}`. The executor decides when to call it, with an empty `input`; the server runs a separate pass on the advisor, which has no tools, over the executor's full transcript, billed at the advisor's rates.
- **Pairs:** "The advisor must be Claude Sonnet 4.6 or a more capable model, and it must be at least as capable as the executor."
- **Results.** Sonnet 5.5, Fable 5.1, Mythos 5.1, Opus 5.5, Opus 5, Fable 5, Mythos 5 and Haiku 5.5 advisors return an encrypted `advisor_redacted_result` your client can't read; Opus 4.8 returns plaintext `advisor_result`. Send the blocks back verbatim.
- **Failure doesn't fail the request:** `advisor_tool_result_error` with `max_uses_exceeded`, `too_many_requests`, `overloaded`, `prompt_too_long`, `execution_time_exceeded`, `model_not_found` or `unavailable`. Executor 429s do fail it.
- **Caps.** `max_uses` is per request; there is no conversation cap, so count client-side and drop the tool (keep the history, and keep sending the beta header). Top-level `max_tokens` doesn't bound the advisor: set `max_tokens` on the tool (minimum 1024). Anthropic's test on a hard reasoning set (n = 40) found `2048` cut mean advisor output about 7x with near-zero truncation.
- **Caching.** `caching: {"type": "ephemeral", "ttl": "5m"}` is an on/off switch for the advisor's own transcript; it breaks even at roughly three advisor calls. `clear_thinking` with `keep` other than `"all"` causes advisor-side cache misses.
- **Usage:** top-level `usage` is executor-only; `usage.iterations` carries `advisor_message` entries.
- **Under-calling.** Without prompt steering executors tend to under-call it on coding tasks. Anthropic's reminder after the first turn gained about 7 points on Haiku 4.5, nothing on Sonnet, and slightly lowered Opus.

## [CAPI-029] Server tools next to client tools: mixed turns, `pause_turn` and `allowed_callers`
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Server tools](https://platform.claude.com/docs/en/agents-and-tools/tool-use/server-tools), [Troubleshooting tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/troubleshooting-tool-use)
- Related: CAPI-006, CAPI-008, CAPI-007, TOK-094

**Mixed turn.** When Claude calls a server tool (`web_fetch`) and one of your client tools together, the API doesn't run the server tool. It returns at once with `stop_reason: "tool_use"` (not `pause_turn`), a `server_tool_use` block with no result block, and your `tool_use`. To continue:
- Send a user message containing only the `tool_result` blocks for the client IDs, and keep the same `tools`.
- Any text after the results ends the turn and returns 400: the server tool "was found without a corresponding" result block. Without that server tool in `tools`, the 400 ends `but no ... tool was provided`.
- The API runs the deferred server tool at the start of that request; the result block arrives in the next response, paired by `tool_use_id`.

A `pause_turn` response is different: re-send it unchanged, with the same tools, and cap the number of continuations.

**`allowed_callers`.** Basic `web_search_20250305` and `web_fetch_20250910` are ZDR-eligible. The `_20260209` and later versions use code execution for dynamic filtering and aren't by default; set `"allowed_callers": ["direct"]` to bypass it. Those versions default to the code-execution caller only, and on models without programmatic tool calling they require `["direct"]`.

**Domain filters** on server tools: no scheme; a subdomain entry matches only that subdomain; web search accepts subpaths, web fetch matches the domain only; no `*` in the host; `allowed_domains` or `blocked_domains`, not both.

## [CAPI-030] Tool-use request errors: symptom, cause and fix
- Type: pattern
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-10-30
- Sources: [Troubleshooting tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/troubleshooting-tool-use)
- Related: CAPI-004, CAPI-006, CAPI-029

| Symptom | Fix |
|---|---|
| Claude calls the wrong tool | Differentiate tools by when to use them, not only what they do. |
| Claude never calls a tool | Look for duplicate names; add `input_examples`. |
| Invented parameters or enum values | `strict: true` if the schema is in the supported subset; shrink the enum or add `input_examples`. |
| Calls run one after another | Return all `tool_result` blocks in one user message. |
| `disable_parallel_tool_use` ignored | Set it on the request that returns `tool_use`; later requests don't change earlier calls. |
| Every request misses the cache | Hold `tool_choice`, thinking and effort constant (CAPI-027). |
| Adding a tool mid-conversation breaks the cache | Use `defer_loading: true` with tool search, or CAPI-022. |
| `tool_use ids were found without tool_result blocks immediately after` | One `tool_result` per `tool_use`, and results before any text. |
| `Unsupported regex feature in pattern field` | Strict tools can't compile backreferences, lookarounds, word boundaries or large `{n,m}` ranges; simplify. |
| `All tools have defer_loading: true` | At least one tool must load immediately. |
| 400 that `thinking` or `redacted_thinking` blocks "cannot be modified" | Echo the whole assistant turn back; a filter that drops `redacted_thinking` causes it. |

**Claude flags a tool result as a prompt injection.** Instructions you deliver inside `tool_result` content are treated as untrusted third-party content. Keep the result to data, and send instructions in a user turn after it or, on supported models, in a mid-conversation system message (CAPI-021).

**String comparison on tool inputs fails on newer models.** Unicode and forward-slash escaping differs between model versions: parse the JSON, never match raw strings.

## [CAPI-031] Anthropic tool type strings, versions and shared tool properties
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Tool reference](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-reference), [Fine-grained tool streaming](https://platform.claude.com/docs/en/agents-and-tools/tool-use/fine-grained-tool-streaming), [Computer use tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool)
- Related: CAPI-001, CAPI-026, CAPI-028, CAPI-032, CAPI-034

Type strings on 2026-10-30 (newest first; older ones keep working):

| Tool | `type` | Runs | Beta header |
|---|---|---|---|
| Web search | `web_search_20260318`, `_20260209`, `_20250305` | server | none |
| Web fetch | `web_fetch_20260318`, `_20260309`, `_20260209`, `_20250910` | server | none |
| Code execution | `code_execution_20260521`, `_20260120`, `_20250825` | server | none |
| Advisor | `advisor_20260301` | server | `advisor-tool-2026-03-01` |
| MCP connector | `mcp_toolset` | server | `mcp-client-2025-11-20` |
| Memory | `memory_20250818` | client | none |
| Bash | `bash_20250124` | client | none |
| Text editor | `text_editor_20250728` (Claude 4 and later), `_20250124` | client | none |
| Computer use | `computer_toolset_20260801` | client | none |
| Browser use | `browser_toolset_20260801` | client | none |

The older `computer_20251124` and `computer_20250124` need `computer-use-2025-11-24` and `computer-use-2025-01-24`. A new version ships when behaviour, schema or model support changes: `_20260209` web tools add dynamic filtering, `web_fetch_20260309` a cache-bypass option, `_20260318` response-inclusion control.

**Properties on any tool:** `cache_control`; `strict` (not `mcp_toolset` or the two client toolsets); `defer_loading`; `allowed_callers` (`"direct"` or a code-execution caller); `input_examples` (not server tools or the client toolsets); `eager_input_streaming` (user-defined tools only), which streams input unbuffered and unvalidated, so guard the JSON parse.

**Client toolset entries** (computer, browser) take no `name`. The API rejects `strict`, `input_examples`, `defer_loading` on the entry, a `tool_choice` of type `tool` naming them, and the legacy fine-grained streaming header. They aren't Managed Agents tools.

## [CAPI-032] Code execution tool: versions, container limits and billing
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Code execution tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/code-execution-tool)
- Related: CAPI-007, CAPI-031, TOK-024, TOK-094

**Versions.** `code_execution_20250825` adds Bash and file operations. `code_execution_20260120` adds REPL state and programmatic tool calling. `code_execution_20260521` is the same runtime but tells Claude about the "90-second wall-clock limit" on each Python cell. None needs a beta header. Current web search and fetch (`_20260209`, later) need `20260120` or later. To check support, read `capabilities.server_tools.code_execution.supported`, not the top-level `capabilities.code_execution`, which is about calling your other tools.

**Container.** Python 3.11, Linux x86_64, 5 GiB RAM, 5 GiB disk, 1 CPU. The container has no internet access ("Completely disabled for security"), so only the pre-installed libraries (pandas, numpy, scipy, matplotlib, openpyxl, python-docx, pypdf and others) are there. Containers expire 30 days after creation and are checkpointed after about 5 minutes idle; pass the `container` ID from a response to reuse one. The `expires_at` in the response is a shorter rolling value. Container data is retained up to 30 days.

**Billing.** It is free when `web_search_20260209` or `web_fetch_20260209` (or later) is in the request. Otherwise: 1,550 free hours a month per organization, then $0.05 an hour per container, with a 5-minute minimum. Files in the request bill execution time even if the tool isn't called.

**Next to your own Bash tool**, Claude can act as if state were shared between the two environments. Say in the system prompt that variables and files don't persist between them. This matters because web search and fetch turn code execution on automatically.

## [CAPI-033] Token overhead each tool adds to a request
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Tool use overview: pricing](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview), [Bash tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/bash-tool), [Text editor tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/text-editor-tool), [Computer use tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool), [Browser use tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/browser-use-tool)
- Related: TOK-050, CAPI-026, CAPI-034

Any request with at least one tool gets a tool-use system prompt. Its size per model, for `tool_choice` `auto` or `none` (`any` or `tool` in brackets, where the page lists it):

| Model | Tokens |
|---|---|
| Opus 5.5, Sonnet 5.5 | 286 |
| Haiku 5.5, Opus 5 | 286 (406) |
| Opus 4.8 | 290 (410) |
| Sonnet 5 | 354 (474) |
| Opus 4.7 | 675 (804) |
| Opus 4.6, Sonnet 4.6 | 497 (589) |
| Haiku 4.5 | 496 (588) |

The page has no Fable or Mythos row. With no `tools`, `tool_choice: none` adds 0.

Per tool, on top of that:
- **Bash:** 325 tokens on Claude 4.7 and later and Mythos Preview, 244 on 4.6 and earlier.
- **Text editor** (`text_editor_20250728`): 974 on 4.7 and later, 745 on 4.6 and earlier.
- **Computer use toolset:** about 4,500 (about 4,590 on Sonnet 5, about 4,520 on the other supported models); disabling `zoom` removes about 410.
- **Browser use toolset:** about 6,600 (about 6,670 on Sonnet 5, about 6,610 elsewhere); enabling all four optional members adds about 880.

Screenshots returned in results are billed as image input, roughly 1,000–1,800 tokens each; past 20 images in one request every image is held to a stricter per-side limit, so prune or resize. The response `usage`, or the token counting endpoint, gives the exact count.

## [CAPI-034] Browser and computer use toolsets: loop contract and security
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Browser use tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/browser-use-tool), [Browser and computer use with the SDK toolsets](https://platform.claude.com/docs/en/agents-and-tools/tool-use/browser-use-sdk), [Tool combinations](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-combinations), [Computer use tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool)
- Related: CAPI-031, CAPI-033, BROWSER-001

Declare `{"type": "browser_toolset_20260801"}` (or the computer one). You run the browser; Claude returns member `tool_use` blocks (31 members, four off by default: `javascript_exec`, `file_upload`, `read_console`, `read_network`), each with `toolset_name: "browser"`.

**Loop contract:**
- Run every block in a turn in order, one `tool_result` per block with `toolset_name` echoed; dispatch on the `toolset_name` and `name` pair, since a custom tool may share a name.
- A turn with several members is a batch: stop at the first failure and answer the rest with `is_error: true` and the text `Not executed: an earlier action in this turn failed.`
- A disabled member Claude still names gets an error result, not silence.
- Streaming delivers each member's `input` as one complete `input_json_delta`.
- Element references (`ref_2`) work on pages that expose them; dynamic pages fall back to coordinates.

**Choosing:** the docs call computer use "the most general option and also the slowest". Use the browser toolset when the whole task is in web pages.

**Security, from the docs:**
- A dedicated container or VM with no credentials, and a network-layer domain allowlist re-checked after redirects.
- Refuse any scheme but `http` and `https` in your `navigate` handler: "the API doesn’t filter the URLs Claude opens".
- Treat tab titles, URLs and download paths as untrusted; build page reads from the accessibility tree, not raw DOM.
- A human confirms purchases, account changes and messages, checked in your executor before each call.

Availability: browser use on the Claude API and Google Cloud (Google managed). Computer use also reaches Bedrock, where the earlier `computer_20251124` tool still works. The Python and TypeScript SDKs have beta toolset classes that run the loop.

## [CAPI-035] Four levers for tool context, and Anthropic's tool pairings
- Type: pattern
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Manage tool context](https://platform.claude.com/docs/en/agents-and-tools/tool-use/manage-tool-context), [Tool combinations](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-combinations)
- Related: TOK-038, CAPI-007, CAPI-026, CAPI-027, MEM-030

Pick the lever by where the tokens go:

| Lever | Reduces | Fits |
|---|---|---|
| Tool search | definitions loaded upfront | 20+ tools, most unused each turn |
| Programmatic tool calling | `tool_result` roundtrips | chains of calls that can run as one script |
| Prompt caching | the cost of repeated definitions | a stable toolset |
| Context editing | old `tool_result` blocks | long conversations whose early results are stale |

They compose. Prompt caching "doesn’t reduce the number of tokens in context", only what you pay for them.

Anthropic's pairings, "starting points, not prescriptions":

| Agent | Tools | Note |
|---|---|---|
| Research | `web_search` + `code_execution` | server-side; no client sandbox |
| Coding | `text_editor` + `bash` | client-executed: constrain the directory and commands |
| Cite then fetch | `web_search` + `web_fetch` | fetch only the 2–3 relevant hits |
| Long-running | `memory` + any | memory is orthogonal to the others (MEM-030) |
| Any GUI | `computer_toolset_20260801` | most general, slowest |
| Web-only | `browser_toolset_20260801` | acts on element references, not only pixels |

## Managed Agents

## [CAPI-036] Managed Agents sessions: seeding, per-session overrides and budgets
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Start a session](https://platform.claude.com/docs/en/managed-agents/sessions)
- Related: CAPI-013, CAPI-037, CAPI-038

Managed Agents is beta (header `managed-agents-2026-04-01`) on the Claude API, Claude Platform on AWS and Google Cloud (Anthropic managed). It isn't eligible for zero data retention. A session needs an `agent` ID and an `environment` ID; the sandbox starts provisioning at creation.

**`agent` takes three forms:** an ID string (latest version), a pinned object (`type: "agent"`) to stage rollouts, or `type: "agent_with_overrides"`.

**Overrides** apply to one session and change neither the agent nor its versions. Fields: `model`, `system`, `tools`, `mcp_servers`, `skills`.
- Omitted: inherited. `null` or empty list: cleared, except `model` (400 `agent_model_required`).
- A value replaces the agent's in full, so a `tools` override must list every tool, and a `model` override drops the agent's `effort` and `inference_geo` pin unless you set them again.
- Clearing `tools` with skills still set returns 400, because skills need `read`; clearing `mcp_servers` while an `mcp_toolset` references one returns 400.

**`initial_events`** (up to 50) creates the session already `running`. It accepts `user.message` and one `user.define_outcome`, not `system.message` or confirmations. It is all or nothing: 400 for more than one outcome event, an outcome without a `rubric`, or more than 100 file-sourced document blocks; 413 over 32 MB. The events aren't echoed in the create response.

**Budget.** Only at creation, as a string of US cents (`"125"` is $1.25); the session goes idle with `budget_reached`. You can change or remove it later, but never add one to a session created without it.

`vault_ids` at creation pass stored MCP OAuth credentials; Anthropic refreshes the tokens.

## [CAPI-037] Managed Agents built-in tools, custom tools and web tool restrictions
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-10-30
- Sources: [Tools](https://platform.claude.com/docs/en/managed-agents/tools), [Restrict web search and web fetch domains](https://platform.claude.com/docs/en/managed-agents/tools-web-restrictions)
- Related: CAPI-036, CAPI-038, CAPI-039

`agent_toolset_20260401` enables eight tools by default: `bash`, `read`, `write`, `edit`, `glob`, `grep`, `web_fetch`, `web_search`. Output over 100,000 characters is written to a file in the sandbox and the model gets a truncated preview with the path.

- **Disable** with `{"name": ..., "enabled": false}` in `configs`, or start from nothing with `default_config.enabled: false` and enable by name. An agent update replaces the whole `tools` array.
- **Custom tools** are run by your application, which returns the result. A name can't start with `mcp__` or `ant__` or match a built-in; the description is "by far the most important factor", three to four sentences.
- **Client toolsets** (computer, browser use) aren't available.

**Web tools** run on Anthropic's servers, not in the sandbox, and take `allowed_domains` or `blocked_domains` (not both) per tool:
- 1 to 64 domains of 1 to 255 characters; no scheme, port, wildcard, IP address, bare TLD or non-ASCII (use Punycode); an empty list is rejected.
- A domain matches that host and its subdomains; `www.example.com` doesn't cover `example.com`.
- `web_fetch` domains can't have a path; `web_search` may, but the provider matches paths as URL patterns.
- A fetch of a blocked URL returns an error result `url_not_allowed`; search omits the results.
- Console settings for the organization also apply, redirects included.
- A cloud environment with `limited` networking applies its `allowed_hosts` to them; session creation returns 400 if an `allowed_domains` entry falls outside it.
- In a multiagent session a listed agent can narrow but never widen: allowed lists must all cover a host.
- `max_content_tokens` caps fetched content and `user_location` localizes search. `max_uses`, `citations` and `cache_control` aren't available.

## [CAPI-038] Managed Agents permission policies: `always_allow`, `always_ask` and `auto`
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Permission policies](https://platform.claude.com/docs/en/managed-agents/permission-policies)
- Related: CAPI-012, CAPI-037, CAPI-039

A policy decides when an enabled tool runs. Set it in `default_config.permission_policy` for a toolset or in a `configs` entry for one tool. "Each toolset kind has its own default: the agent toolset defaults to `always_allow`, and MCP toolsets default to `always_ask`." Updates apply to sessions created afterwards; running sessions keep what they started with.

- **`always_allow`:** runs without asking.
- **`always_ask`:** the session goes idle with `stop_reason.type` `requires_action` and the blocking IDs in `stop_reason.event_ids`, and waits indefinitely. Answer each with a `user.tool_confirmation` (`result` `allow` or `deny`, optional `deny_message`).
- **`auto`:** the server judges each call from the tool, its input and the session so far. It runs it, denies it (the agent gets `Permission to use {tool_name} has been denied.` with `is_error: true`, and your client can't override it), or pauses as `always_ask`. No toolset uses it by default.

**`auto` is not a human checkpoint:** "If the server determines that a call is safe, the call runs before anyone sees it, and its effects might not be reversible." Text in `user.message` events counts as your intent, including end-user text you relay; tool results, fetched pages, MCP responses and messages between threads don't. Put `always_ask` on tools an end user shouldn't trigger alone.

**Audit.** Each `agent.tool_use` and `agent.mcp_tool_use` event carries `evaluated_permission` (`allow`, `ask`, `deny`) and an `evaluation` object; under `auto`, a `reason_code` of `indeterminate` or `high_risk`. Tolerate unknown values. A confirmation for an event that isn't `ask` returns 400.

Permission policies don't govern custom tools: your code decides, then sends `user.custom_tool_result`.

## [CAPI-039] Securing a Managed Agents deployment: the settings, in order
- Type: recommendation
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Secure your Managed Agents deployment](https://platform.claude.com/docs/en/managed-agents/secure-deployment), [Security risks and sandbox boundaries](https://platform.claude.com/docs/en/managed-agents/secure-deployment-risks)
- Related: CAPI-013, CAPI-037, CAPI-038, CAPI-040, CAPI-053

The docs' order and recommended values:
1. **Cloud environment**, unless tools must run on your infrastructure.
2. **`limited` networking** with only the hosts the agent needs. Set `networking` on every create request: an omitted one "might get `unrestricted`" (the environments page: "gets `unrestricted`", CAPI-053). Keep `allow_package_managers` and `allow_mcp_servers` `false` and list the registry and MCP hosts you trust instead. "Network access is granted by host, not by operation": `git push` and package publishing included. Avoid `*.` wildcards and shared-hosting domains.
3. **Secrets in vaults**, `injection_location` header only, `networking` `limited` to the exact hosts the key is for. Code sees a placeholder. Never give the agent a Claude API key: code in the sandbox can use it to start sessions or use web tools outside your approvals and budget.
4. **Allowlist on each web tool.** `web_fetch` URLs can carry data to the site they point at.
5. **Policies:** `read`, `glob`, `grep` `always_allow`; `bash`, `write`, `edit` and `web_fetch` `auto`, `always_ask` for irreversible changes or when you relay end-user text; `web_search` `always_ask` if queries may hold sensitive data; MCP tools that change data `always_ask`.
6. **Smallest tool set:** `default_config.enabled: false`, then enable by name, MCP servers too.
7. **A budget** on every session and deployment, in separate workspaces per trust level.

After tightening an environment, start new sessions and stop old ones: a running session can keep the old limits.

`/claude-api managed-agents-secure` in Claude Code checks an agent, its environments and vaults against this guide and changes nothing.

## [CAPI-040] Managed Agents: untrusted input, sandbox boundaries and stopping a session
- Type: pattern
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Secure your Managed Agents deployment](https://platform.claude.com/docs/en/managed-agents/secure-deployment), [Security risks and sandbox boundaries](https://platform.claude.com/docs/en/managed-agents/secure-deployment-risks), [Review and monitor agent sessions](https://platform.claude.com/docs/en/managed-agents/secure-deployment-monitoring)
- Related: CAPI-039, CAPI-038, CAPI-013

**Untrusted input** is anything someone outside your team can write: pages, tickets, emails, repository files, uploads, MCP results, relayed end-user text. Don't give an agent that reads it a powerful tool on `always_allow`. Three designs: split reading from acting across agents, give one narrow custom tool that your application validates, or keep a person on `always_ask`. Agents in one session share the sandbox, files and vault credentials, so a split separates only tools and conversations; use two sessions for a stronger one.

**Hidden loaders:**
- `read` can load `CLAUDE.md` and `AGENTS.md` from the file's directory and parents, plus `@path` references up to five deep: "No setting turns this off except disabling `read`".
- A mounted GitHub repository's `.claude/skills` load as agent instructions with no review.
- A memory store defaults to `read_write`; later sessions read it as trusted. Attach `read_only` unless the agent must write.

**Boundaries.** The agent loop, session history and vault secrets live outside the sandbox. Web tools run on Anthropic's servers, and `web_fetch` opens only URLs already seen in the session. Sandbox state is kept 30 days and session history until you delete it; uploaded files, memory stores and vaults outlive the session.

**Stopping:**
1. Send `user.interrupt` alone. It stops the response, but a running tool call can finish and nothing is undone.
2. Pause the deployment (archive to end the schedule).
3. Rotate any exposed key at the service that issued it.
4. With workflow runs open, also ask the agent to stop them.
5. Wait for `idle`: a running session can't be archived or deleted.

Webhooks to watch: `session.status_idled` (the event itself is `session.status_idle`), `session.budget_reached`, `session.status_terminated` and `deployment_run.failed`. A delivery can be missed, so also list sessions on a schedule.

## [CAPI-052] Managed Agents agent updates: versions, the 409 and which fields replace or merge
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Define your agent](https://platform.claude.com/docs/en/managed-agents/agent-setup)
- Related: CAPI-036, CAPI-038, ORCH-018

An agent is a stored, versioned object. "The `version` starts at 1 and increments each time an update changes the agent." An update that changes nothing makes no new version. Send `version` for optimistic concurrency: a stale one returns 409. Omit it and the last write wins.

**Per field on update:**
- `tools`, `mcp_servers`, `skills`: the array replaces the old one in full.
- `metadata`: merges per key; `null` deletes a key.
- `system`, `description`: `null` clears them. `model` and `name` can't be cleared.
- `effort`: kept while the model `id` stays the same, reset to the new model's default when it changes. Sending `model` without `inference_geo` clears the pin.
- `multiagent`: merges level by level only while the type stays `multiagent_20261001`. `null` inside it means the default, so `workflows: null` turns dynamic workflows on.

**Rollouts.** A session given a bare agent ID gets the latest version; a pinned object keeps one (CAPI-036). A parent's `predefined_agents` keep the child version they pinned until the parent is updated.

**Archive:** "Archiving makes the agent read-only and cannot be undone." Existing sessions continue.

**Geo pins** are checked on save, at session creation and on every turn: narrowing a workspace's `allowed_inference_geos` means "new sessions can’t be created from the agent and running sessions refuse further turns; pins are never exempted".

## [CAPI-053] Managed Agents environments: packages, `allowed_hosts` matching and lifecycle
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Environments](https://platform.claude.com/docs/en/managed-agents/environments), [Secure your Managed Agents deployment](https://platform.claude.com/docs/en/managed-agents/secure-deployment)
- Related: CAPI-037, CAPI-039, CAPI-054

**Packages.** Keys `apt`, `cargo`, `gem`, `go`, `npm`, `pip`, cached across sessions that share the environment. "When multiple package managers are specified, they run in alphabetical order (apt, cargo, gem, go, npm, pip)." Pin syntax differs by manager: `hyperfine@1.18.0`, `rails:7.1.0`, `sqlalchemy==2.0.30`. `packages` with `limited` networking and `allow_package_managers: false` returns 400, even when the registries are in `allowed_hosts`.

**`allowed_hosts`:** bare hostnames or wildcards, with no scheme, port or path. `example.com` doesn't match `www.example.com`, and "`*.example.com` matches every subdomain of `example.com`, but not `example.com` itself." A blocked request on port 80 or 443 gets a 403 that names the host, which makes a missing host easy to spot.

- `limited` with nothing else opens no hosts; attached files, memory stores and GitHub repositories still work.
- `allow_mcp_servers: false`: session creation returns 400 if an agent's MCP host isn't listed; `true` turns that check off.
- The list also limits `web_fetch` and `web_search`, and a host added for them is open to the sandbox too. The two `allow_*` switches add no hosts for those tools.

**Omitted `networking`:** the environments page says a create request "that omits it gets `unrestricted`"; the secure-deployment page says it "might get `unrestricted`". Either way, set it explicitly. The Console form starts on Limited.

**Lifecycle.** "Environments are not versioned", so keep your own record of changes. Delete works only when no session references it; archive leaves running sessions alone. Each session gets its own sandbox and shares no filesystem state with others.

## [CAPI-054] Managed Agents cloud sandbox: what's preinstalled and the limits
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Cloud sandboxes reference](https://platform.claude.com/docs/en/managed-agents/cloud-sandboxes-reference), [Choosing an environment](https://platform.claude.com/docs/en/managed-agents/choosing-an-environment)
- Related: CAPI-053, SURF-027

Ubuntu 24.04 LTS on x86_64, with memory up to 8 GB and disk up to 10 GB. This is the Managed Agents sandbox, not Claude Code on the web's.

- **Languages:** Python 3.10 to 3.13; Node.js 20, 21 and 22 (default); Go 1.24 (default) and 1.25; Rust stable; OpenJDK 21; Ruby 3.1 to 3.3; PHP 8.3; GCC 13 and Clang.
- **Databases:** PostgreSQL 16 and Redis 7 are installed; "The server is not running by default." SQLite comes through language bindings.
- **Tools:** git, curl, jq, yq, make, cmake, ripgrep, ffmpeg, ImageMagick, pandoc, headless LibreOffice, tesseract (English only), TeX Live. Docker has "limited availability".
- **Browser:** Playwright for Python and Node with Chromium at `/opt/pw-browsers/chromium`, not on `PATH`; no Firefox or WebKit. "Use the pre-installed packages rather than installing another Playwright version, which would look for a browser build that is not present."

**Default networking differs by route:** API-created environments default to `unrestricted`, sandboxes provisioned through Claude Studio to `limited`.

**Cloud or self-hosted.** Self-hosted sandboxes don't get `file` or `github_repository` resources, repository skill discovery, environment-variable vault credentials or these runtimes. The docs: "Choose a self-hosted sandbox only if tools must run on infrastructure you control."

## [CAPI-055] Managed Agents session files: mount paths, outputs and the 500-file cap
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Files](https://platform.claude.com/docs/en/managed-agents/files), [Session operations](https://platform.claude.com/docs/en/managed-agents/session-operations)
- Related: CAPI-010, CAPI-036, CAPI-063

"A maximum of 500 files is supported for each session." Upload through the Files API, then attach as a `file` resource at creation or later through `/v1/sessions/{id}/resources`.

**Inputs.** A `mount_path` of `/data.csv` lands at `/mnt/session/uploads/data.csv`; with no path it is `/mnt/session/uploads/<file_id>`. "Files mounted in the sandbox are read-only copies." Each mount gets a new `file_id`, and these copies don't count against storage limits.

**Outputs.** The agent writes to `/mnt/session/outputs/`. List them with `GET /v1/files?scope_id=<session id>`, with the beta header. They can arrive after the idle event: "If an output file you expect is missing, list again after a short delay; once it appears in the list, its upload is complete."

**Lifetime.** Deleting a session removes the files it produced, not your Files API uploads (CAPI-063).

The page states no per-file size limit or type restriction here; the agent unpacks archives itself with `bash`. Files in `initial_events` have their own limit: 100 file-sourced document blocks and 32 MB per request (CAPI-036).

## [CAPI-056] Managed Agents skills: pinning, the 500 cap and repository discovery
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Skills](https://platform.claude.com/docs/en/managed-agents/skills)
- Related: CAPI-040, SKILL-081

An agent's `skills` entry is `{type, skill_id, version}`. `type` is `anthropic` (IDs such as `pptx`, `xlsx`, `docx`, `pdf`) or `custom` (`skill_...`). "Pin to a specific version or use `latest`. Optional. Defaults to `latest` when omitted." Upload bundles to `POST /v1/skills`, not the Files API.

**Cap:** each session supports up to 500 skills, counted across all its agents after removing duplicates. More skills slow sandbox start.

**Repository skills.** For a mounted `github_repository`, only `.claude/skills/<name>/SKILL.md` at the repository root is found:
- not a deeper folder, a bare `.claude/skills/SKILL.md` or a `skills/` folder outside `.claude`;
- it follows `checkout`, otherwise the default branch;
- the agent needs `read` enabled;
- cloud sandboxes only.

"The scan runs once, when the session starts. Commits pushed mid-session are not picked up; to load updated skills, start a new session." These skills load with no review, so treat a repository you don't control as untrusted input (CAPI-040).

## [CAPI-057] Managed Agents MCP connector: declaring servers, credential matching and failures
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [MCP connector](https://platform.claude.com/docs/en/managed-agents/mcp-connector), [Reference](https://platform.claude.com/docs/en/managed-agents/reference)
- Related: CAPI-013, CAPI-036, CAPI-038, CAPI-053, CAPI-073

Declare each server in `mcp_servers` (`type: url`, unique `name`, `url`) and reference it from an `mcp_toolset` through `mcp_server_name`; a server with no toolset, or a toolset with no server, is rejected. "An agent can declare up to 20 MCP servers." Names run to 255 characters and URLs to 2,048. Definitions hold no secrets: credentials come from `vault_ids` at session creation.

**Matching.** A vault credential matches on `mcp_server_url` after normalizing host case, the default port and a trailing slash. A different path, subdomain or non-default port doesn't match. "If none matches, the connection is attempted unauthenticated."

**Failures don't stop the session.** "Session creation does not validate MCP connectivity or credentials." A failure emits `session.error` with `mcp_connection_failed_error` or `mcp_authentication_failed_error`, and the session runs on. "The connection is retried on the next `session.status_idle` to `session.status_running` transition."

**Output and transport.** Output over 100,000 characters (about 25,000 tokens) goes to a file. Servers use streamable HTTP; "servers that only support the deprecated SSE transport still work through an automatic fallback". `configs` take only `name`, `enabled` and `permission_policy`.

## [CAPI-058] Managed Agents API rate limits, and what the reference doesn't cap
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Reference](https://platform.claude.com/docs/en/managed-agents/reference)
- Related: CAPI-013, CAPI-072

Per organization: 300 requests per minute on create endpoints (agents, sessions, environments) and 1,200 on read endpoints (retrieve, list, stream). "Organization-level spend limits and usage-tier rate limits also apply."

The reference states no cap on concurrent sessions, and doesn't say what happens when a scheduled run starts while the previous session still runs. The Rate Limits API (CAPI-072) doesn't cover these limits.

**Naming a product built on it:** "Claude Agent" and "{YourAgentName} Powered by Claude" are allowed; names using "Claude Code" or "Claude Cowork" aren't.

## [CAPI-059] Moving to Managed Agents: what each Agent SDK feature becomes
- Type: comparison
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Migration](https://platform.claude.com/docs/en/managed-agents/migration)
- Related: CAPI-011, CAPI-014, CAPI-038, CAPI-052

The Messages loop goes away: the session stores history and `session.status_idle` ends your loop.

| Agent SDK | Managed Agents |
|---|---|
| `ClaudeAgentOptions` | A stored, versioned agent |
| `cwd`, `add_dirs` | File resources; built-in tools run against `/workspace` |
| `CLAUDE.md` hierarchy | One `system` string |
| `permission_mode`, `can_use_tool` | `permission_policy` per tool |
| Hooks | `always_ask` on built-in tools |
| `max_turns` | "Count turns client-side." |
| Plan mode | "Run a planning-only session first, then a second session to run the plan." |
| Output styles, slash commands | Apply them in your client |

**Traps:**
- Under `auto`, a hook-style check on your client misses calls: "if the server evaluates a call as safe, it runs without reaching your client."
- `max_tokens` and `thinking` aren't exposed on the agent, and prefill doesn't exist.
- A model change takes effect on the next session you create.
- A bare agent ID always gets the latest version; the page advises to "pin sessions to a specific version to promote or roll back without a deploy".

## [CAPI-060] Managed Agents event stream: opening order and reconnecting
- Type: pattern
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Events and streaming](https://platform.claude.com/docs/en/managed-agents/events-and-streaming), [Session threads](https://platform.claude.com/docs/en/managed-agents/session-threads)
- Related: CAPI-061, CAPI-062, CAPI-064

"A stream delivers only the events emitted after it opens, so open the stream before you send events to avoid a race condition."

**After a dropped connection:**
1. Open a new stream.
2. List the session's events and collect their IDs.
3. Tail the stream, skipping IDs you've seen. Previews (`event_start`, `event_delta`) have no top-level `id` and aren't replayed.
4. If the session is paused, `stop_reason.event_ids` on the latest `session.status_idle` lists the calls still to answer.

Thread streams work the same way: "A thread's stream doesn't replay earlier events." A new thread's list can be empty right after `session.thread_created`.

`processed_at` is null while a sent event is queued.

## [CAPI-061] Managed Agents event deltas: opting in and rebuilding previews
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Event deltas](https://platform.claude.com/docs/en/managed-agents/event-deltas)
- Related: CAPI-009, CAPI-060

Live text previews are opt-in per connection: repeat the query parameter `event_deltas[]` with `agent.message` or `agent.thinking`. "Any other value returns a 400 error, as does a request with more than 100 values." It works on the session stream and on a thread's stream. `agent.thinking` gets `event_start` only, with no content.

**Order for one model request:** `span.model_request_start`, `event_start`, `event_delta`s, the buffered `agent.message`, `span.model_request_end`.

**Rebuilding:** key a map on `(event_id, delta.index)`, append `delta.content.text`, and drop the preview when the buffered `agent.message` with that `id` arrives. Close leftovers on `span.model_request_end`.

**Traps:**
- "The delta type is `content_delta`, not `content_block_delta`. Accumulator code written for the Messages API does not carry over unchanged."
- "Under load, the server might shed deltas for an event." You get a prefix: "the buffered `agent.message` is always the authoritative record."
- Deltas are never stored or replayed, and cover text only, not tool use or results.
- "A connection previews only the thread it's reading", so a child's previews never reach the session stream.

## [CAPI-062] Managed Agents: when is a session done, and what to answer while it waits
- Type: pattern
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Events and streaming](https://platform.claude.com/docs/en/managed-agents/events-and-streaming), [Workflow runs](https://platform.claude.com/docs/en/managed-agents/workflow-runs)
- Related: CAPI-038, CAPI-060, CAPI-067

`session.status_idle` carries `stop_reason.type`: `end_turn`, `requires_action` or `budget_reached`.

- **`end_turn`** also means interrupted: "The idle event's `stop_reason.type` is `end_turn`, the same value as a turn that completes on its own."
- **`requires_action`:** "a `user.message` returns 400, so answer the calls first."
- **`budget_reached`:** a `user.message` returns 400 until you raise or remove the budget. "No event you send resumes a session paused at its budget."

**With workflow runs open, idle isn't done.** Finished means every created run has `workflow_run.status_ended`, followed by a `session.status_idle` with `end_turn` that your own interrupt didn't cause. Meanwhile the session can stay `running` while a tool call waits on you, so answer custom tool calls and `evaluated_permission` `ask` calls as their events arrive, not at idle.

**Other details:**
- With runs, idle can carry `retries_exhausted`: the turn failed on an error, a run may still be going, and if a run ended unread the server starts a new turn by itself.
- A custom tool result can go as soon as its event arrives, without waiting for idle; `requires_action` still follows and can be ignored. "A second result for the same call is accepted and has no effect."

## [CAPI-063] Managed Agents session lifecycle: mid-session changes, archive and delete
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Session operations](https://platform.claude.com/docs/en/managed-agents/session-operations), [Events and streaming](https://platform.claude.com/docs/en/managed-agents/events-and-streaming), [Workflow runs](https://platform.claude.com/docs/en/managed-agents/workflow-runs)
- Related: CAPI-021, CAPI-036, CAPI-040, CAPI-062

Statuses: `idle`, `running`, `rescheduling`, `terminated`. "A session that completes its work goes `idle`, not `terminated`." Send a `user.message` to resume. "Sandbox state is preserved for only 30 days after the sandbox is created, and activity does not extend this window."

**Mid-session changes.** Only the agent's tools and MCP servers can change, as a full replacement, and "The session must be `idle` to update the agent." Any open workflow run returns 400, even when idle. `model`, `system`, `skills` and the geo pin stay fixed.

**`system.message`** adds instructions: a `role: "system"` turn that applies from then on and doesn't replace `system`. It takes 1 to 1,000 text items, lands on the primary thread only and is rejected with `model_does_not_support_mid_conversation_system` on models without support.

**Budget.** A new cap "must be strictly greater than the session's consumed list cost". Removal is one-way: "You therefore can't re-add a removed budget or add one to a session created without it."

**Archive and delete.** Not while `running`. With a run open, either may return 400 (`workflow_run_open`) or succeed; a successful archive ends open runs as `stopped`.

"Deleting a session is permanent." It removes the record, events, sandbox and files the session produced. Memory stores, vaults, skills, environments, agents and Files API uploads stay.

## [CAPI-064] Managed Agents session threads: streams, interrupts and answering a subagent
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Session threads](https://platform.claude.com/docs/en/managed-agents/session-threads)
- Related: ORCH-018, CAPI-038, CAPI-060, CAPI-067

The session stream is the primary thread, a condensed view with thread starts, ends and blocking events. Each child has `/threads/{thread_id}/stream` with its reasoning and tool calls. Any thread `running` makes the session `running`. The budget is one shared cap, each thread priced at its own model. ORCH-018 holds the limit of 25 child threads; advisor and workflow-run threads are exempt from it.

**Answering.** A subagent's `always_ask` and custom tool calls are cross-posted to the primary stream with `session_thread_id`; answer there and it's routed. The two copies have different `id`s, so match on `type` plus `tool_use_id`.

**Races.** A child's `session.thread_status_idle` can arrive before the tool events it lists, and "A `user.tool_confirmation` for a call whose event hasn't arrived yet can return 400." Answer each `ask` as its event arrives.

**Under `auto`:** "Nothing in a subagent's thread counts as your intent." A server denial isn't cross-posted; it shows only on the child's stream, and the child keeps running.

**Interrupts.** `user.interrupt` with `session_thread_id` hits one thread; without it, every non-archived thread including the primary. An interrupted child sends the primary no report, so the primary won't start a turn until something else reaches it. A thread on `requires_action` counts as idle, so it can be archived.

## [CAPI-065] Managed Agents outcomes: `user.define_outcome`, the grader and results
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Define outcomes](https://platform.claude.com/docs/en/managed-agents/define-outcomes), [Workflow runs](https://platform.claude.com/docs/en/managed-agents/workflow-runs)
- Related: CAPI-015, CAPI-036, CAPI-055, CAPI-067

An outcome tells the agent what done means. A grader checks the work against a rubric: "The grader uses a separate context window to avoid being influenced by the main agent's implementation choices." Send `user.define_outcome` with `description`, `rubric` (Markdown, inline or a Files API `file_id`) and `max_iterations`, "optional; default 3, max 20". The agent starts on receipt, with no `user.message` needed.

"Only one outcome is supported at a time, but you can chain outcomes in sequence." Chain after the terminal `span.outcome_evaluation_end`.

**Results in that event:**
- `satisfied`: the session goes idle.
- `needs_revision`: the agent continues.
- `max_iterations_reached`: "One final acknowledgment turn follows before the session transitions to `idle`. No further evaluation runs."
- `failed`: the rubric doesn't apply to the deliverables.
- `interrupted`: `user.interrupt` arrived.

**Following it.** `iteration` counts from 0. `span.outcome_evaluation_ongoing` is a heartbeat; the grader's reasoning stays hidden. `GET /v1/sessions/{id}` shows `outcome_evaluations[].result`. Deliverables go in `/mnt/session/outputs/` (CAPI-055).

With workflow runs, "no evaluation starts while a run is open", running or idle. The page gives no grader cost or rubric size limit.

## [CAPI-066] Managed Agents usage fields: list cost, active seconds and the session viewer
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Session observability](https://platform.claude.com/docs/en/managed-agents/session-observability)
- Related: CAPI-013, CAPI-070, TOK-123

**`usage` on a session:** `input_tokens` (uncached), `output_tokens`, `cache_read_input_tokens`, `cache_creation` (split by TTL), `list_cost`, `active_seconds`, `server_tool_use`. The session emits a `session.usage` event just before every idle.

- `list_cost` is whole cents as a string, plus a currency code.
- `active_seconds` counts overlapping threads once. "The session's runtime cost is priced on this duration." `stats.active_seconds` sums per thread instead.
- Per-thread figures are rounded separately and leave out running-time cost, so they don't add up to the session's `list_cost`.
- "Web fetch requests carry no per-request charge and aren't metered, so `web_fetch_requests` reads `0`."

**Debugging.** The Console viewer at `platform.claude.com/sessions` has a timeline, transcript and Inspector tabs. `?event={event_id}` links to an event, and `ant beta:sessions connect` opens the session from a terminal. "The session viewer is only accessible to Developers and Admins."

**Org view.** In the Usage and Cost API (TOK-123), group by `account_id` or `service_account_id`. Workspace keys and deployments run as `svac_...` service accounts, with `api_key_id` and `account_id` null.

## [CAPI-067] Managed Agents workflow runs: limits, results and how to stop one
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Workflow runs](https://platform.claude.com/docs/en/managed-agents/workflow-runs)
- Related: ORCH-018, CAPI-040, CAPI-052, CAPI-062, CAPI-064

A workflow is a program the agent writes; the server runs it in the background, starting agents in threads it creates. Turn it on with `workflows` in the `multiagent` block. "There's no approval step before a run starts", so to review first, tell the agent to describe its plan and wait. "Only the agent on the session's primary thread starts runs", and they don't nest.

**Limits:** 64 threads working at once in a run, 1,000 agents over its life (`thread_limit_error`), 24 hours by default or what the agent sets (`timeout_error`), 10 runs open at once per session (`max_workflow_runs_error`; idle runs count).

**Against ordinary threads:** the program decides which agents run next and writes their prompts, and you can't see the code or per-thread results. A run's threads share the sandbox but not history, sit outside the 25-thread cap and can't be archived or stopped by ID.

**Results:** `completed`, `stopped`, `error`. "The result doesn't say whether the work passed": read each thread's events. Failed agents retry once on a new thread, so make tools idempotent.

**Stopping.** "No event you send ends a run; archiving the session can." `user.interrupt` ends none: send a `user.message` asking the agent to stop.

**Cost.** "A run has no price of its own": tokens count against the session budget. At the cap every open run pauses, and "A paused run's lifetime keeps passing". "Run events don't trigger webhooks."

## Agent SDK: sessions, input, output and options

Read 2026-11-01 from `code.claude.com/docs/en/agent-sdk/` (FreekMencke/claude-kb#351, part C). Latest `@anthropic-ai/claude-agent-sdk` on that day: 0.3.316 (`npm view @anthropic-ai/claude-agent-sdk dist-tags`). The pages describe the SDK versions they name; local Claude Code was 2.1.296.

## [CAPI-041] SessionStore: the two required methods and how resume uses them
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Persist sessions to external storage](https://code.claude.com/docs/en/agent-sdk/session-storage), [Agent SDK Python reference](https://code.claude.com/docs/en/agent-sdk/python)
- Related: CAPI-011, CAPI-042, ORCH-015, MEM-028

A `SessionStore` mirrors transcripts to your own backend "so a session created on one host can be resumed on another host running from a matching working directory". Only `append(key, entries)` and `load(key)` are required. `projectKey` encodes the working directory, so resume from the same `cwd`.

**Optional methods and what breaks without them:**
- No `listSessions`: `continue: true` throws, and `listSessions({ sessionStore })` throws unless `listSessionSummaries` exists.
- No `listSubkeys`: resume restores only the main transcript, not the subagent files.
- No `delete`: `deleteSession` is a no-op, which suits append-only backends. When you do implement it, deleting the main key must cascade to every subkey and the summary entry.

**Dual write.** The subprocess writes to local disk first and the SDK forwards each batch, so "the store is a mirror of the local transcript rather than a replacement for it". On a run resumed from the store, "the local copy is deleted at run end, so the store holds the only durable copy".

**Resume fallbacks when the store has nothing:** `resume` passes the ID to the subprocess, which resumes the local transcript. `continue: true` in TypeScript starts a fresh session, and `continue_conversation=True` in Python continues the newest local one.

Python's `session_store_flush` defaults to `"batched"` (once per turn or when the buffer fills); `"eager"` flushes after every frame. `load_timeout_ms` defaults to `60000`. `InMemorySessionStore` is for tests; S3, Redis and Postgres reference adapters sit under `examples/session-stores/` in both SDK repos and are copied, not installed.

## [CAPI-042] SessionStore traps: option conflicts, auth in the temp config dir, lost batches
- Type: anti-pattern
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Persist sessions to external storage](https://code.claude.com/docs/en/agent-sdk/session-storage)
- Related: CAPI-041, CAPI-011

**Startup errors.** The SDK throws if a store is combined with TypeScript `persistSession: false` (it turns off the local writes the mirror is built from) or with file checkpointing (`enableFileCheckpointing` / `enable_file_checkpointing`; backups go to local disk and aren't mirrored).

**`Not logged in`.** A run resumed from the store runs under a temporary `CLAUDE_CONFIG_DIR`. TypeScript copies credentials, `.claude.json` and your user `settings.json` into it (from v0.3.222; earlier only the first two), stripping `enabledPlugins`, `extraKnownMarketplaces`, its `additionalMarketplaces` alias (from v0.3.232) and `CLAUDE_CONFIG_DIR` in `env`. Python copies only credentials and `.claude.json`, so an `apiKeyHelper` in user `settings.json` fails there. The same error appears if you point a fresh session's `CLAUDE_CONFIG_DIR` at a temp folder to avoid local transcripts and sign in through claude.ai or `apiKeyHelper`: use `ANTHROPIC_API_KEY`, or `CLAUDE_CODE_OAUTH_TOKEN` from `claude setup-token` (model requests only, so claude.ai connectors are unavailable).

**Mirror writes are best-effort.** A rejected `append` is retried up to two more times; a timed-out call isn't retried. Then the SDK logs it, emits `{ type: "system", subtype: "mirror_error" }`, drops the batch and continues. A retried batch can re-deliver entries, so deduplicate by `entry.uuid`. On a run resumed from the store, a dropped batch has no other copy.

**Other behaviour.** `forkSession` rewrites session IDs and message UUIDs, so a backend-side object copy gives a broken fork. `getSessionMessages` returns the post-compaction chain (503 raw entries may give 18 messages); call `store.load(key)` for everything. "The SDK never deletes from your store on its own": set expiry yourself, because a store-resumed run leaves no local transcript for `cleanupPeriodDays` to sweep.

## [CAPI-043] canUseTool: when it fires, what to return and how to wait for a slow human
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Handle approvals and user input](https://code.claude.com/docs/en/agent-sdk/user-input), [Configure permissions](https://code.claude.com/docs/en/agent-sdk/permissions)
- Related: CAPI-012, CAPI-044, HOOK-006

CAPI-012 has the evaluation order. This entry is the callback's contract.

- **It fires only for a call nothing earlier approved.** "The callback never fires for auto-approved tools." For logic on every call, use a `PreToolUse` hook; a `PermissionRequest` hook can send Slack or email while the SDK waits.
- **It can wait forever.** "The callback can stay pending indefinitely." If the person may take longer than your process can live, register a `PreToolUse` hook that returns `defer`, so the process exits and resumes from the persisted session.
- **Allow:** `{ behavior: "allow", updatedInput }` (Python `PermissionResultAllow(updated_input=...)`). Before Claude Code v2.1.207 an allow without `updatedInput` was rejected with a validation error. Claude isn't told you changed the input.
- **Deny:** `{ behavior: "deny", message }`. Claude reads the message and may change approach, so write it as guidance (`compress them into an archive instead`).
- **Remember a choice:** echo one of `context.suggestions` back in `updatedPermissions`. A `localSettings` destination writes `.claude/settings.local.json`. TypeScript options carry `suppressAlwaysAllowRule: true` (v0.3.268+) when an always-allow choice must not be offered; Python's context lacks it. Python needs `claude-agent-sdk` 0.1.80+ for this.
- **Redirect entirely** with streaming input, not the callback (CAPI-046).

In Python the page's examples pass a streaming prompt and a dummy `PreToolUse` hook returning `{"continue_": True}`, commented "Required workaround: dummy hook keeps the stream open for can_use_tool".

## [CAPI-044] AskUserQuestion in the SDK: your callback answers, with limits
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Handle approvals and user input](https://code.claude.com/docs/en/agent-sdk/user-input)
- Related: CAPI-043, ORCH-010

Claude's clarifying questions arrive in `canUseTool` with `toolName === "AskUserQuestion"`. "You can't add your own questions to this flow", so ask your own questions in application code.

- **Allow-list trap.** `AskUserQuestion` is available by default. If you pass a `tools` array (a read-only agent with `Read`, `Glob`, `Grep`), include `AskUserQuestion` in it or Claude can't ask.
- **Limits:** 1 to 4 questions per call, 2 to 4 options each, `header` at most 12 characters. "`AskUserQuestion` is not currently available in subagents spawned via the Agent tool."
- **Reply shape:** return `behavior: "allow"` with `updatedInput` holding the original `questions` plus `answers`, a record keyed by the question text whose value is the chosen option `label`. For multi-select pass an array of labels or join them with `", "`; a free-text answer is the typed text. Omitting `questions` from `updatedInput` is a mistake the example comments warn against ("must include original questions").
- **Previews (TypeScript).** `toolConfig.askUserQuestion.previewFormat` set to `"markdown"` or `"html"` adds a `preview` per option, for the whole session. Unset (default) means no previews. The SDK rejects `<script>`, `<style>` and `<!DOCTYPE>` in HTML previews before your callback runs; check for `undefined` before rendering.
- Questions are common in `plan` mode.

## [CAPI-045] Structured outputs in the Agent SDK: draft-07, retries and the silent-success case
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Get structured output from agents](https://code.claude.com/docs/en/agent-sdk/structured-outputs), [Troubleshoot the Agent SDK](https://code.claude.com/docs/en/agent-sdk/troubleshooting)
- Related: CAPI-005, CAPI-051, TOK-121

Pass `outputFormat: { type: "json_schema", schema }` (Python `output_format`); the final `ResultMessage` carries `structured_output`. This is the agent-loop feature, with tools used first. CAPI-005 covers the single-turn API feature and its guarantees; the SDK instead validates and re-prompts.

- **Draft-07 only.** "The SDK validates schemas with JSON Schema draft-07", so a schema declaring a newer version is rejected. Zod emits 2020-12 by default: `z.toJSONSchema(schema, { target: "draft-7" })`. Pydantic: `.model_json_schema()`.
- **Invalid schema.** Since Claude Code v2.1.205 an invalid schema fails the run at startup with an error; before that it was ignored and you got free text. `format` (such as `"email"`) is an annotation and not enforced; before v2.1.205 it made a schema invalid.
- **Two failure shapes.** Subtype `error_max_structured_output_retries` ends a single-shot `query()` with a raise after the error result. A `success` result with `structured_output` missing is also a failure: causes are a refusal (`stop_reason` is `"refusal"`) or a schema nothing can satisfy (`minLength` above `maxLength`). A model fallback can also retract a finished output mid-stream and end in the retries error. Read the result's `errors` list to tell validation from fallback.
- Test `subtype === "success" && structured_output`, never `subtype` alone.
- Keep schemas focused, make fields optional when the task may not supply them.

## [CAPI-046] Streaming input versus single-message input, and the V2 session API that is gone
- Type: comparison
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Streaming input](https://code.claude.com/docs/en/agent-sdk/streaming-vs-single-mode), [TypeScript V2 preview (removed)](https://code.claude.com/docs/en/agent-sdk/typescript-v2-preview), [Configure your agent](https://code.claude.com/docs/en/agent-sdk/configuration)
- Related: CAPI-011, CAPI-043, TOK-121

**Streaming input** (an `AsyncIterable` of user messages) is the page's preferred mode. It gives image attachments, queued messages, interrupts, `setModel` and `setPermissionMode`, and a session that stays alive. **Single-message input** (a string) suits one-shot work and stateless hosts such as a lambda; it lacks images, queueing, interrupts and natural multi-turn. It can still `continue: true` or `resume`.

**Failure traps:**
- A TypeScript message generator that throws ends the stream with `Claude Code process aborted by user`, not your error, sometimes after a long minified line. Check your generator first.
- A Python generator exception is logged at debug level and the session stalls with no raise. Turn on debug logging.
- An image block with a missing `source` raises nothing: Claude sees a text note such as `[Image could not be processed: image block has no source object]`.
- A single-shot `query()` that ends in an error result such as `error_max_turns` yields it, then raises.

**V2 is removed.** `unstable_v2_createSession`, `unstable_v2_resumeSession`, `unstable_v2_prompt` and the `SDKSession` types went in TypeScript SDK 0.3.142; the version jumped from 0.2.x. For old code pin `@anthropic-ai/claude-agent-sdk@0.2`. Migrate to `query()` with an `AsyncIterable<SDKUserMessage>` or `options.resume`.

## [CAPI-047] Python SDK differs from TypeScript: query() versus ClaudeSDKClient and other traps
- Type: comparison
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Agent SDK reference - Python](https://code.claude.com/docs/en/agent-sdk/python), [Troubleshoot the Agent SDK](https://code.claude.com/docs/en/agent-sdk/troubleshooting)
- Related: CAPI-012, CAPI-046, CAPI-049

- **`query()` or `ClaudeSDKClient`.** `query()` starts a fresh session each call and can't interrupt. `ClaudeSDKClient` keeps one session across exchanges and supports `interrupt()`, `set_model`, `rewind_files`, `get_context_usage`, MCP toggling and `stop_task`. Use it for chat UIs or when the next step depends on the reply.
- **Don't `break` out of the message loop.** The page: "avoid using `break` to exit early as this can cause asyncio cleanup issues". Use a flag and let it finish.
- **`interrupt()` doesn't clear the buffer.** The interrupted turn's messages, its `ResultMessage` included, stay in the stream. Drain with `receive_response()` before reading the next answer, or you get the old turn's messages.
- **`receive_response()` stops at the first `ResultMessage`**, so one `query()` plus one loop per prompt.
- **Sandbox fails open.** With `enabled: True` and no working sandbox, commands run unsandboxed with a stderr warning; the TypeScript SDK's `failIfUnavailable` defaults to `true`. Set `"failIfUnavailable": True` in Python to stop instead. With `bypassPermissions` plus `allowUnsandboxedCommands` the model can leave the sandbox silently.
- **Names.** `AgentDefinition` fields are camelCase (`disallowedTools`); snake_case raises `TypeError`. `TypedDict` types are plain dicts (`config["budget_tokens"]`). Hook output uses `continue_` and `async_`.
- `setting_sources=[]` did not disable filesystem settings in Python SDK 0.1.59 and earlier.
- Fewer hook events than TypeScript (CAPI-012).

## [CAPI-048] Todo and Task tools in the SDK are off on newer models
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Track todos](https://code.claude.com/docs/en/agent-sdk/todo-tracking)
- Related: ORCH-010

`TodoWrite`, `TaskCreate`, `TaskGet`, `TaskUpdate` and `TaskList` are "available by default only on Claude Opus 4.7, Claude Sonnet 4.6, Claude Haiku 4.5, and earlier models". On every other model, unrecognised model IDs included, there are no `tool_use` blocks for them unless you opt in. The set applies from Claude Code v2.1.268, which the TypeScript SDK bundles from v0.3.268. Newer models track multi-step work without a todo list, so opt in only when your app renders or logs the calls.

**Opt in** with one of: naming a tool in `allowedTools`; listing it in `tools` (which restricts built-in tools to the ones named); or `CLAUDE_CODE_ENABLE_TODO_TOOLS=1` in `env`. In TypeScript `env` replaces the subprocess environment, so spread `process.env`; Python merges. A custom `pathToClaudeCodeExecutable` or `cli_path` gets that install's own defaults.

Where available you get the four Task tools, or `TodoWrite` alone with `CLAUDE_CODE_ENABLE_TASKS=0`. Lifecycle: `pending`, `in_progress`, completed, and `status: "deleted"` through `TaskUpdate`.

**Read the stream defensively.** Claude Code repairs near-miss keys before running (`id` or `task_id` become `taskId`, `active_form` becomes `activeForm`), but "that repair is not reflected in the stream". The `+` log in the page's example doesn't carry assigned IDs, so it can't match updates to creates; capture IDs from results for that. The `SDKTaskNotificationMessage` family reports background tasks, not todos.

## [CAPI-049] SDK start-up and exit errors: message, cause, fix
- Type: pattern
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Troubleshoot the Agent SDK](https://code.claude.com/docs/en/agent-sdk/troubleshooting)
- Related: CAPI-011, CAPI-042, CAPI-047

| You see | Cause and fix |
|---|---|
| Python `CLINotFoundError: Claude Code not found at: ...` | No `claude` found; with `cli_path` set the SDK skips discovery, so a native install can't help. Check `claude --version` in the app's own environment: IDEs and service managers use another `PATH`. |
| TS `Native CLI binary for <platform>-<arch> not found` | The install skipped optional dependencies. Reinstall without that, or set `pathToClaudeCodeExecutable`. In `bun build --compile` the cause differs. |
| Python `Refusing to execute batch script ...claude.cmd` | Deliberate hardening against `cmd.exe` injection (Python SDK 0.2.124+). Use a native `claude.exe`, or the Windows x64 wheel, which bundles one. |
| `Failed to start Claude Code` / `exists but failed to launch` | Path points to something that can't run. In a container the bundled binary may not match its architecture or libc; reinstall the SDK during the image build. |
| Python `ProcessError: Command failed with exit code 1` | Its `Error output:` line is fixed text, not stderr. Pass a `stderr` callback in options. |
| `ResultError` (0.2.140+) | The CLI reported an error result first. It subclasses `ProcessError`, so put `except ResultError` first. `data` holds the full result. |
| TS `Claude Code process exited with code N. stderr: ...` | A plain `Error` with no class: wrap the `for await` loop in try/catch and match the message. A signal gives `terminated by signal <name>`. |
| `Claude Code returned an error result: ...` | Both SDKs; start from the text after the colon. |
| `Not connected. Call connect() first.` | Use `async with ClaudeSDKClient()` or call `connect()`. |

## [CAPI-050] Agent SDK options: caps, environment, fallback and mid-session switches
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Configure your agent](https://code.claude.com/docs/en/agent-sdk/configuration), [Agent SDK reference - Python](https://code.claude.com/docs/en/agent-sdk/python)
- Related: TOK-121, CAPI-011, CAPI-046, MEM-028

- **Caps.** Both are off when unset. `maxTurns: 0` means no limit, same as unset. `maxBudgetUsd: 0` is rejected at startup, "the session never runs".
- **`env`.** TypeScript: it "replaces the subprocess environment", so spread `process.env` or lose `PATH`, `HOME` and `ANTHROPIC_API_KEY`. Python merges over the inherited environment.
- **No sampling knobs.** `temperature`, `top_p` and `max_tokens` have no option field in either language; use `effort`, a spend cap, or the Messages API.
- **Fallback.** `fallbackModel` takes one model or a comma-separated chain. The primary is retried at each user turn. In TypeScript a fallback equal to `model` throws at startup.
- **Settings.** `settings` (path or inline JSON) overrides user, project and local settings; only managed policy outranks it. `settingSources: []` loads none.
- **Setters need streaming input.** `setModel()` with no argument returns to Claude Code's default, not your `model` option. A session in auto mode that switches to a model auto mode doesn't support falls back to `default` mode. After a model switch the next request recomputes the whole conversation uncached, since each model has its own cache.
- TypeScript `updateSettings("userSettings", ...)` accepts only `effortLevel`, and the running session's effort doesn't change.
- **Python timeouts** go through `env`: `API_TIMEOUT_MS` (headers only, default `600000`), `CLAUDE_CODE_MAX_RETRIES` (default 10, cap 15), `CLAUDE_ASYNC_AGENT_STALL_TIMEOUT_MS` for subagents (default 600000; stream-idle plus 5 minutes from v2.1.257). SURF-043 has the stream watchdogs.

## [CAPI-051] ResultMessage: a "success" result can still be an error
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Agent SDK reference - Python](https://code.claude.com/docs/en/agent-sdk/python)
- Related: TOK-121, CAPI-045, CAPI-008

TOK-121 lists the subtypes. The Python reference adds that `subtype="success"` does not mean the turn worked: `is_error` is `True` on `success` in three cases, told apart by `stop_reason`.

1. `"refusal"`: the model declined; the text is in `result`, or in the preceding `AssistantMessage` when `result` is empty.
2. `"tool_deferred_unavailable"`: a deferred tool was gone on resume. With no prompt the call stays pending and runs first once the tool is back; a prompt answers without it and the deferred call is dropped.
3. Anything else: an error reported in place of a model reply, such as an API error. Read `terminal_reason` (`"completed"`, `"max_turns"`, `"api_error"`, `"aborted_streaming"`, `"aborted_tools"`), `result`, and `api_error_status`.

**Check order** (`ResultError` too): `stop_reason`, then `terminal_reason`, then `subtype`. A refusal's `terminal_reason` doesn't single it out.

**Accounting.** `usage` covers the main loop only. `model_usage` covers subagents and internal calls such as compaction, and is "an estimate, not a billing statement". In streaming input mode `model_usage` and `total_cost_usd` are cumulative, so read the latest result and don't sum. `origin` (Python SDK 0.2.137+) separates your prompt's result from an injected turn: several background-task notifications that finish together give one `ResultMessage` each, all but the last with `num_turns` 0 and empty `result`.

## [CAPI-068] Agent SDK partial-message streaming: what doesn't arrive and in what order
- Type: anti-pattern
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Streaming output](https://code.claude.com/docs/en/agent-sdk/streaming-output), [Agent SDK TypeScript reference](https://code.claude.com/docs/en/agent-sdk/typescript)
- Related: CAPI-045, CAPI-046, CAPI-069

Turn on with `includePartialMessages` (TypeScript) or `include_partial_messages` (Python) to get `StreamEvent`s. Text chunks are `content_block_delta` with `delta.type` `text_delta`.

**Traps:**
- **Subagents:** "Stream events are emitted for the main session only; token-level deltas from subagents aren't forwarded." `forwardSubagentText` (default `false`) forwards a foreground subagent's finished text and thinking blocks instead, with `parent_tool_use_id` set.
- **Order:** `AssistantMessage` arrives per completed block, before that block's `content_block_stop`, and blocks of one message share its ID.
- **Cut streams:** `content_block_stop` arrives for the open block unless it is a tool call, so treat that call's input as incomplete. `message_delta` can be missing after a dropped connection.
- **Older CLIs:** before Claude Code v2.1.290 a cut stream could end without `message_stop`. The TypeScript SDK bundles v2.1.290 from v0.3.290, the Python SDK from v0.2.164.
- **Structured output:** the JSON streams as unvalidated `input_json_delta` chunks; only `ResultMessage.structured_output` holds the validated result (CAPI-045).

## [CAPI-069] Agent SDK TypeScript options the other entries don't cover
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Agent SDK TypeScript reference](https://code.claude.com/docs/en/agent-sdk/typescript)
- Related: CAPI-041, CAPI-050, CAPI-068, TOK-121

Picked from the Options table of `agent-sdk/typescript.md`, grepped, not read in full; CAPI-050 holds the caps and fallback options.

- **`taskBudget`** (alpha, `{ total: number }`): an API-side token budget the model can see, so it can wrap up before the limit. `maxBudgetUsd` is a hard stop instead.
- **`maxThinkingTokens`:** "*Deprecated:* Use `thinking` instead."
- **`resumeSessionAt` with `resumeDropsTurn`** (Claude Code v2.1.223 or later): a truncating resume, refused if the discarded range holds anything not attributable to that turn.
- **`forwardSubagentText`:** default `false` (CAPI-068).
- **`loadTimeoutMs`** (default `60000`) and **`sessionStoreFlush`** (default `'batched'`): alpha, for a session store only (CAPI-041).

## Telemetry and admin APIs

## [CAPI-070] Claude API OpenTelemetry: the two switches, span names and prompt content
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [OpenTelemetry tracing](https://platform.claude.com/docs/en/manage-claude/opentelemetry), [Get Claude API spans](https://platform.claude.com/docs/en/manage-claude/opentelemetry/api), [Get Claude SDK spans](https://platform.claude.com/docs/en/manage-claude/opentelemetry/sdk)
- Related: CAPI-066, CAPI-071, TOK-012, TOK-122

"OpenTelemetry export is in beta." This is tracing of API calls, separate from Claude Code's telemetry (TOK-012) and the Agent SDK's (TOK-122).

**Two independent switches, usable together:**
- **SDK tracing:** install the SDK and register your own tracer provider. Needs no permission; covers client tools and other API requests such as file uploads.
- **API tracing:** add a destination in the Console or through the Admin API (beta header `telemetry-destinations-2026-08-11`). Needs the Console admin role and works with any client; gives per-model-run spans, Managed Agents turns and server tools.

**Spans** follow the GenAI semantic conventions. The SDK's `anthropic.messages.create` (CLIENT) parents the API's (SERVER); the API adds `anthropic.model_request`, tool spans, `anthropic.compaction` and `anthropic.session.turn`. Group session spans by `gen_ai.conversation.id` (thread) or `anthropic.session.id`.

**Prompt content** is off by default: "Metadata only (`metadata_only` in the SDK): The default." Full content goes in `gen_ai.input.messages`, `gen_ai.output.messages` and `gen_ai.system_instructions`. "A full 1M-token context window needs about 4 MB", against a default of 0.75 MB per span; truncated spans set `anthropic.content.truncated`.

## [CAPI-071] API trace delivery and counting tokens from spans
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Get Claude API spans](https://platform.claude.com/docs/en/manage-claude/opentelemetry/api), [OpenTelemetry tracing](https://platform.claude.com/docs/en/manage-claude/opentelemetry)
- Related: CAPI-070, TOK-123

**Delivery:** "Best effort: A span can be lost before delivery." and "At least once: A destination can receive the same span more than once." Dedupe on trace ID plus span ID. Spans aren't a complete usage record: the API emits none when the `traceparent` sampled flag is off. Use TOK-123 for billing figures.

**Your endpoint:** "your endpoint must complete the TLS handshake within 5 seconds and send the response headers within 5 seconds." A destination is disabled when the endpoint sends a `3xx` redirect or "All deliveries fail for 24 hours." Spans for a disabled destination are lost.

**Limits:** 10 destinations per organization, 1,000 workspaces per destination, 20 headers per destination.

**Counting tokens.** Use one source: "When a Messages API request has both an SDK span and an API span, sum its API spans." And "`gen_ai.usage.input_tokens` already includes the tokens read from and written to the prompt cache, so don't add the cache attributes to it." Compaction tokens sit apart in `anthropic.usage.compaction.*`.

## [CAPI-072] Rate Limits API: reading limits and overriding them per workspace
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [Rate Limits API](https://platform.claude.com/docs/en/manage-claude/rate-limits-api)
- Related: CAPI-058, TOK-018

Admin credentials only: workspace API keys don't work.

- **Organization:** `GET /v1/organizations/rate_limits`, read-only. You can't set organization limits here.
- **Workspace override:** `POST /v1/organizations/workspaces/{workspace_id}/rate_limits/{rate_limit_id}`; `null` clears it. "The lower of the workspace override and the organization-level limit applies, and a change takes effect within about an hour."
- The workspace list returns only overrides unless `include_inherited=true`.
- `group.id` (`rlg_...`) is the stable key. `rate_limit_id` is the entry's top-level `id`, not that one.
- Managed Agents limits aren't included (CAPI-058).

Uses: sync limits to a gateway, or compare them with analytics usage (TOK-123).

## [CAPI-073] MCP tunnels: private MCP servers without inbound ports
- Type: comparison
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-11-01
- Sources: [MCP tunnels overview](https://platform.claude.com/docs/en/agents-and-tools/mcp-tunnels/overview), [Security](https://platform.claude.com/docs/en/agents-and-tools/mcp-tunnels/security)
- Related: CAPI-057

Tunnels connect private-network MCP servers to Claude with outbound traffic only, so you don't open inbound firewall ports or allowlist Anthropic's IP ranges. "MCP tunnels are in research preview", by request form, with no uptime, support or continuity commitment, and not eligible for zero data retention.

**What you run:** `cloudflared` plus Anthropic's proxy, on Kubernetes (Helm) or Docker Compose, with outbound 7844 to the Cloudflare edge and 443 to `api.anthropic.com`, a tunnel token and a CA certificate you register.

**Security:** outer mTLS, inner TLS to your proxy and OAuth on each server. Cloudflare can't read payloads but sees metadata such as timing and byte volume. `upstream.allowed_ips` is "the proxy's primary SSRF defense", and a tunnel doesn't authenticate to the MCP server, so keep the server's own auth. Respond to a breach by archiving the tunnel, which invalidates its token.

**Reach:** Managed Agents and the Messages API MCP connector only. "MCP tunnels created through the Console are not available as connectors in claude.ai."

**Against exposing the server directly:** tunnels remove the public endpoint and add two containers, a Cloudflare dependency and a research-preview service. The pages don't compare them; this is our reading.

## Recommendations for our setup

Ranked by impact against effort. None of our public repos calls the Claude API or the Agent SDK on 2026-10-17, so these are rules for when one starts to, plus one decision about scheduled work.

1. **Keep scheduled repo upkeep on routines; don't move it to Managed Agents** (CAPI-014, CAPI-013). The weekly docs-drift routine (DOC-024) runs on subscription usage at no extra cost, and a deployment would add API tokens plus $0.08 per running hour. Revisit only if a job needs a hard spend cap per run, runs more often than hourly, or needs a secret the model must not see.
2. **When a repo first calls the API, pin these from day one** (CAPI-001, CAPI-002, CAPI-004, CAPI-009):
   - the model ID and an explicit `effort`;
   - no sampling parameters, prefill or forced `tool_choice`;
   - read blocks by `type`;
   - `strict: true` tools or `output_config.format` for machine-read output;
   - streaming for long outputs;
   - a cap on retries against spend-cap 429s;
   - `system`, `tools` and earlier messages append-only, with changes sent as mid-conversation system messages (CAPI-016, CAPI-017, CAPI-021).

   In Claude Code, `/claude-api migrate` does the per-model swaps.
3. **Scripted Claude runs stay on `claude -p --bare`** with `--max-turns`, `--max-budget-usd` and `--strict-mcp-config` (CAPI-011, MCP-012). Reach for the Agent SDK only for a service that needs approval callbacks or a session store. An SDK bump is a Claude Code upgrade, so read both CHANGELOGs.
4. **Before shipping an LLM feature, write its eval first** (CAPI-015): 20–50 cases from real inputs, code graders where possible, and an LLM grader on a different model with a rubric. Re-run it before each model migration.

5. **If a Managed Agents agent is ever deployed, start from CAPI-039's settings** (`limited` networking, vault secrets, web-tool allowlists, `auto` or `always_ask`, a budget), and keep untrusted input away from any tool on `always_allow` (CAPI-040). `/claude-api managed-agents-secure` checks an agent against the guide.

6. **Don't adopt MCP tunnels** (CAPI-073). Research preview with no continuity commitment and no claude.ai connector use, and our servers are already reachable without them.

No issue was opened in another repo: none of these needs a change there today.

## Open questions

- **Agent SDK not run.** `agent-sdk/typescript.md` was grepped for options (CAPI-069), not read in full. The SDK was not installed, so none of CAPI-041 to CAPI-051, CAPI-068 or CAPI-069 was run against a real session (store resume, `maxBudgetUsd: 0`, `AskUserQuestion` limits).
- **Haiku 4.5's retirement.** The deprecations page still shows `claude-haiku-4-5-20251001` as Active, "Not sooner than October 15, 2026", two days after that date, with no deprecation entry (CAPI-003). Re-check the page.
- **Batch with Files.** Can a Message Batches request reference a `file_id`? Neither the Files nor the Batch processing page says (CAPI-010).
- **Managed Agents limits.** The endpoint rate limits are in CAPI-058. Still unanswered after reading `reference`, `scheduled-deployments`, `session-operations` and `workflow-runs`: any cap on concurrent sessions, and what happens when a scheduled run starts while the previous session still runs (CAPI-013).
- **Managed Agents outcomes.** Grader cost and the rubric size limit aren't on `define-outcomes` (CAPI-065).
- **Are the 500-file and 500-skill caps hard errors, and with which status?** `files` and `skills` state only the caps (CAPI-055, CAPI-056).
- **Per-run caps for routines.** None found on the routines page (CAPI-014).
- **Billing of SDK or `claude -p` runs on a subscription login**, outside the `--bare` and API-key path. The auth precedence allows it, and no page states how it counts (CAPI-011). `agent-sdk/cost-tracking.md` wasn't read for this.
- **Pages in the 2026-10-30 pass read for entries but not turned into one.** `handle-tool-calls`, `how-tool-use-works`, `build-a-tool-using-agent` and `mid-conversation-effort-example` (a worked orchestration mode) are tutorials of material in CAPI-006, CAPI-021 and CAPI-030; `web-search-tool` and `web-fetch-tool` beyond TOK-094, `bash-tool` and `text-editor-tool` beyond CAPI-033, and the computer use tool's member actions weren't read in full.
- **Whether `auto` permission evaluations are logged anywhere besides the `evaluation` object** on each event (CAPI-038). The permission-policies page says nothing about retention or a rate of denials.
- **Whether MCP credentials in a vault are visible to the model.** The vaults page says it for `environment_variable` credentials only (CAPI-013).
