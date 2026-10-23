# Building on the Claude API, Agent SDK and Managed Agents

Prefix `CAPI`. This file covers building on Claude as a developer on 2026-10-17:
- which request settings return 400 on the 5.x models;
- model IDs and the retirement schedule;
- tool design: forced tool choice, strict tools, the tool runner, programmatic tool calling, parallel calls;
- structured outputs, stop reasons, refusals, streaming and retries in the TypeScript SDK;
- Files, citations and Batch for a small app;
- the Agent SDK against `claude -p`, Managed Agents scheduled deployments against Claude Code routines;
- how Anthropic says to evaluate an LLM feature.

It records decisions and pitfalls. For a full API reference, use the bundled `claude-api` skill or the docs. Model choice and effort live in `kb-orchestration.md` (ORCH-026 to ORCH-028), caching and pricing in `kb-token-usage.md` (TOK-050 to TOK-055), prompting in `kb-prompting.md`.

Research basis:
- Researched 2026-10-17 (FreekMencke/claude-kb#181, part of roadmap #167) by an Opus 5.5 lead with Sonnet 5.5 readers.
- Docs were read as raw `.md` pages from `platform.claude.com/docs/en/…` and `code.claude.com/docs/en/…`, found through each site's `llms.txt`.
- Versions come from the npm registry (`npm view @anthropic-ai/sdk dist-tags` gives `latest: 0.135.0`, published 2026-10-15; `npm view @anthropic-ai/claude-agent-sdk dist-tags` gives `latest: 0.3.302`, published 2026-10-16; dates from `npm view <pkg> 'time[<version>]'`).
- Tested on Node 24.21.0 (WSL2) with `npm install --ignore-scripts @anthropic-ai/sdk@0.135.0 @anthropic-ai/claude-agent-sdk@0.3.302` in a scratch folder, reading the installed files only.
- No API call was made: no API key was used, so API behaviour is quoted from the docs, not tested.
- None of our public repos (osrs-tracker-web, osrs-tracker-api, freek-mencke-web, claude-skills) depends on `@anthropic-ai/sdk` or the Agent SDK. Checked 2026-10-17 with a grep of their `package.json` files and workflows.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Which request settings return 400 on the 5.5 models? | `budget_tokens`, non-default `temperature`/`top_p`/`top_k`, assistant prefill and `computer_20251124` (API and Google Cloud) on all of them. Forced `tool_choice` (`any`, `tool`) on Opus 5.5, Sonnet 5.5 and Fable 5.1. `thinking: disabled` on Opus 5.5, Sonnet 5.5 and Fable 5.1. Editing history before a replayed thinking block (accounts created on or after 2026-08-31). | CAPI-001, CAPI-002 |
| How do I force a tool call on Opus 5.5 or Sonnet 5.5? | You can't: use `tool_choice: auto`, say in the user turn when to call it, and mark the tool `strict: true`, or use structured outputs for a JSON answer. Haiku 5.5 still accepts forced tool choice, but then skips thinking. | CAPI-004 |
| Can I turn thinking off? | Haiku 5.5 and Opus 5: `disabled` at `high` effort or below. Sonnet 5.5: `between_tools` (up-front thinking off). Opus 5.5 and Fable 5.1: no, lower the effort instead. Check `capabilities.thinking.types.disabled` in the Models API. | CAPI-001, CAPI-003 |
| Is `claude-sonnet-5-5` an alias that moves to a newer model? | No. From the 4.6 generation on, a dateless ID is a pinned snapshot; only older models have aliases that point to the latest dated snapshot. | CAPI-003 |
| Which models retire next, and how do I check? | Sonnet 4.5 (`claude-sonnet-4-5-20250929`) retires 2026-11-30, replacement `claude-sonnet-5-5`. The model deprecations page lists every date, with at least 60 days' notice; the Console's Usage export shows which keys still call a model. | CAPI-003 |
| What limits do strict tools and structured outputs have? | 20 strict tools, 24 optional parameters and 16 union-typed parameters per request in total; no recursive schemas or numeric and string-length constraints; a 180-second compile timeout. Not available for Opus 5.5 or Haiku 5.5 on Claude in Amazon Bedrock. | CAPI-004, CAPI-005 |
| Is structured output guaranteed to match the schema? | Not on `stop_reason: refusal` or `max_tokens`, and an enum value can come back in another capitalisation. It returns 400 with citations, and it can't be combined with prefill or with programmatic tool calling's strict tools. | CAPI-005 |
| Which stop reasons must my code handle? | `end_turn`, `max_tokens`, `stop_sequence`, `tool_use`, `pause_turn` (server tools), `refusal` (HTTP 200, read `stop_details`) and `model_context_window_exceeded`. | CAPI-008 |
| Does the TypeScript SDK retry, and when must I stream? | 2 retries by default (connection errors, 408, 409, 429, 5xx) and a 10-minute timeout. It throws on a non-streaming request expected to run past about 10 minutes: stream, and call `stream.finalMessage()` if you only want the whole message. | CAPI-009 |
| Tool runner or my own loop? | The SDK's tool runner (beta; `client.beta.messages.toolRunner` with `betaZodTool`) for most apps. Write the loop yourself when you need human approval, custom logging or conditional execution. | CAPI-006 |
| Files API, citations or Batch for a small app? | Files when the same document is reused or goes to code execution (operations free, 500 MB a file). Citations when users must see the source passage (`cited_text` isn't billed as output). Batch for anything that can wait up to 24 hours (TOK-054). | CAPI-010 |
| Agent SDK or `claude -p`? | `claude -p --bare` with `--max-turns` and `--max-budget-usd` for one prompt in a script. The Agent SDK for a Node service that needs `canUseTool`, hook callbacks, in-process tools or a session store. Both run the same Claude Code binary. | CAPI-011, CAPI-012 |
| Managed Agents scheduled deployment or a Claude Code routine? | A routine for repo maintenance on a subscription (1-hour minimum interval, subscription usage). A deployment when you need minute-level cron, a hard USD cap per run, or secrets the model never sees; it bills API tokens plus $0.08 per running session-hour. | CAPI-013, CAPI-014 |
| How should I test an LLM feature? | Write success criteria first, then many automated cases from real tasks and failures (20–50 to start). Grade with code where possible, an LLM grader with a rubric and thinking on otherwise, and humans as a last resort. Grade the outcome, not the path. | CAPI-015 |

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
| CAPI-014 | Scheduled agent work: Managed Agents deployment or Claude Code routine | comparison | managed-agents, routines, schedule, cost, secrets |
| CAPI-015 | Evaluating an LLM feature: success criteria, test sets and graders | recommendation | evals, graders, testing, llm-judge |

---

## Breaking changes and model lifecycle

## [CAPI-001] Request settings that return 400 on the 5.x models
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Thinking](https://platform.claude.com/docs/en/build-with-claude/thinking), [Define tools: forcing tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools), [Model deprecations: API parameter deprecations](https://platform.claude.com/docs/en/about-claude/model-deprecations), [Haiku 5.5 migration guide](https://platform.claude.com/docs/en/models/haiku-5-5/migration-guide), [Sonnet 5.5 migration guide](https://platform.claude.com/docs/en/models/sonnet-5-5/migration-guide), [Opus 5.5 migration guide](https://platform.claude.com/docs/en/models/opus-5-5/migration-guide), [Release notes](https://platform.claude.com/docs/en/release-notes/overview)
- Related: PROMPT-002, ORCH-028, CAPI-002, CAPI-004

Code written for a 4.x model or Sonnet 5 can fail on the current models with `invalid_request_error`. Per model (thinking page's table, define-tools, migration guides):

| Setting | Opus 5.5 | Sonnet 5.5 | Haiku 5.5 | Fable 5.1 |
|---|---|---|---|---|
| `thinking: {type: "enabled", budget_tokens}` | 400 | 400 | 400 | 400 |
| `thinking: {type: "disabled"}` | 400 | 400 (send `between_tools`) | OK at `high` effort or below | 400 |
| `tool_choice` `any` or `tool` | 400 | 400 | OK, no thinking before the call | 400 |
| Non-default `temperature`/`top_p`/`top_k` | 400 | 400 | 400 | 400 |
| Final assistant turn (prefill) | 400 | 400 | 400 | 400 |

The deprecations page scopes the sampling 400 to "Claude 4.7 and later models". On Haiku 5.5, `temperature` "must be `1`" and `top_p` "must be `0.99`", and sending both is rejected. On the Claude API and Google Cloud, computer use needs `computer_toolset_20260801`: Opus and Sonnet 5.5 reject `computer_20251124`, and Haiku 5.5 rejects `computer_20250124`.

The release notes summarise each launch: Sonnet 5 code "can break on Claude Sonnet 5.5 in five ways" (2026-09-28), and Haiku 4.5 code "can break on Claude Haiku 5.5" (2026-10-07). In Claude Code, `/claude-api migrate this project to <model>` applies the swaps for you (migration guides).

## [CAPI-002] Thinking blocks in responses: read by type, pass back, keep history append-only
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Sonnet 5.5 migration guide](https://platform.claude.com/docs/en/models/sonnet-5-5/migration-guide), [Haiku 5.5 migration guide](https://platform.claude.com/docs/en/models/haiku-5-5/migration-guide), [Fable 5.1 migration guide](https://platform.claude.com/docs/en/models/fable-5-1/migration-guide)
- Related: CAPI-001, PROMPT-002, TOK-050

All four current models think by default when the request has no `thinking` field, which changes what a response looks like:
- **Read blocks by `type`.** A response "can begin with `thinking` blocks, so code that reads `content[0].text` breaks." Thinking text is empty by default (`display: "omitted"`); set `display: "summarized"` to get it.
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
- Last verified: 2026-10-17
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
- Last verified: 2026-10-17
- Sources: [Define tools](https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools), [Strict tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/strict-tool-use), [Structured outputs: schema complexity limits](https://platform.claude.com/docs/en/build-with-claude/structured-outputs), [Fable 5.1 migration guide](https://platform.claude.com/docs/en/models/fable-5-1/migration-guide)
- Related: CAPI-001, CAPI-005, CAPI-007

Opus 5.5, Sonnet 5.5 and Fable 5.1 return 400 ("tool_choice: type "tool" and "any" are not supported for this model.") for forced tool choice. The docs' replacement:
- Use `{type: "auto"}` "plus an explicit instruction and `strict: true` tools, or JSON outputs".
- Put the instruction in the user turn, or in a mid-conversation `role: "system"` message "when your application requires the call" (Fable 5.1 guide).
- On Amazon Bedrock use `auto` alone, since structured outputs aren't available there for these models.

`strict: true` makes the `input` "strictly follow the `input_schema`", with a valid tool `name`, through grammar-constrained sampling.

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
- Last verified: 2026-10-17
- Sources: [Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs), [Citations](https://platform.claude.com/docs/en/build-with-claude/citations), [Programmatic tool calling](https://platform.claude.com/docs/en/agents-and-tools/tool-use/programmatic-tool-calling)
- Related: CAPI-004, CAPI-008, CAPI-010, PROMPT-011

JSON outputs (`output_config.format`) are GA with no beta header on the Claude API, Google Cloud and Foundry, for every current model. On Claude in Amazon Bedrock they're unavailable; only the legacy Bedrock integration has them, for 4.x models.

The deprecated `output_format` now needs the `structured-outputs-2025-11-13` header, or it returns 400.

Not guaranteed:
- **Refusals:** "The output may not match your schema because the refusal message takes precedence over schema constraints." A property that asks for step-by-step reasoning "may lead to a `reasoning_extraction` refusal".
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
- Last verified: 2026-10-17
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
- Last verified: 2026-10-17
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
- `allowed_callers` "is not a hard API-level block on direct invocation": still handle a direct `tool_use`.

## [CAPI-008] Stop reasons and refusals an app must handle
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-10-17
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

**Fallback.** Server-side fallback (`fallbacks: "default"`, header `server-side-fallback-2026-07-01`) is Claude API only and not in Batch. "Claude Haiku 5.5 has no server-side fallback": use the SDK's client-side fallback or your own retry.

## [CAPI-009] TypeScript SDK: retries, timeouts, streaming and request size
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [TypeScript SDK](https://platform.claude.com/docs/en/cli-sdks-libraries/sdks/typescript), [Errors](https://platform.claude.com/docs/en/api/errors), [Streaming](https://platform.claude.com/docs/en/build-with-claude/streaming)
- Related: CAPI-008, TOK-054

**Retries.** Connection errors, 408, 409, 429 and >=500 "are all retried by default", "2 times by default, with a short exponential backoff", honouring `retry-after`. Set `maxRetries` to change it. A 429 caused by a usage tier's monthly spend cap "has no `retry-after` header and keeps failing until access resumes": don't let it retry forever. Sudden traffic growth can hit "acceleration limits", so ramp up gradually.

**Timeouts.** "By default requests time out after 10 minutes". The SDK "throws an error if a non-streaming request is expected to be above roughly 10 minutes long", which a large `max_tokens` triggers. Timed-out requests are retried twice too. Fixes:
- Stream, and use `stream.finalMessage()` to get the complete `Message` without handling events.
- Or use Batch for work that can wait.

Tested 2026-10-17, `@anthropic-ai/sdk@0.135.0`: `client.d.ts` documents `timeout=10 minutes` and `maxRetries=2`.

**Mid-stream errors.** An error such as `overloaded_error` (HTTP 529 when not streaming) can arrive as an event "after the API returns a 200 response". Resuming an interrupted stream is documented "for Claude 4.5 models and earlier" only.

**Request size.** Messages and token counting: 32 MB. Batch: 256 MB. Files: 500 MB.

## [CAPI-010] Files API, citations and Batch for a small app
- Type: comparison
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Files API](https://platform.claude.com/docs/en/build-with-claude/files), [Citations](https://platform.claude.com/docs/en/build-with-claude/citations), [Batch processing](https://platform.claude.com/docs/en/build-with-claude/batch-processing)
- Related: TOK-054, CAPI-005, CAPI-007

| | Files API | Citations | Batch |
|---|---|---|---|
| Status | GA, no beta header (`files-api-2025-04-14` optional) | GA, all active models | GA (TOK-054) |
| Platforms | Claude API, Claude Platform on AWS, Foundry (hosted on Anthropic) | All five, Bedrock and Google Cloud included | See TOK-054 |
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
- Last verified: 2026-10-17
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
- Last verified: 2026-10-17
- Sources: [SDK permissions](https://code.claude.com/docs/en/agent-sdk/permissions), [SDK hooks](https://code.claude.com/docs/en/agent-sdk/hooks), [Agent SDK TypeScript reference](https://code.claude.com/docs/en/agent-sdk/typescript)
- Related: CAPI-011, ORCH-015, HOOK-001, REPO-031

"When Claude requests a tool, the SDK checks permissions in this order":
1. **Hooks.** A hook can deny; "A hook that returns `allow` does not skip the deny and ask rules below".
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
- Last verified: 2026-10-17
- Sources: [Scheduled deployments](https://platform.claude.com/docs/en/managed-agents/scheduled-deployments), [Budgets](https://platform.claude.com/docs/en/managed-agents/budgets), [Vaults](https://platform.claude.com/docs/en/managed-agents/vaults), [Webhooks](https://platform.claude.com/docs/en/managed-agents/webhooks), [Pricing](https://platform.claude.com/docs/en/about-claude/pricing), [Release notes](https://platform.claude.com/docs/en/release-notes/overview)
- Related: ORCH-018, MEM-031, CAPI-014

All of these are beta under `managed-agents-2026-04-01`. Managed Agents launched 2026-04-08.

**Scheduled deployments** (2026-06-09):
- A cron `expression` plus an IANA `timezone`, at minute granularity.
- Execution has jitter "of up to 15% of the interval between runs, with a minimum of 5 seconds and a maximum of 9 minutes".
- "A maximum of 1,000 scheduled deployments is supported per organization."
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
- Up to three delivery attempts; "Ordering is not guaranteed".

## [CAPI-014] Scheduled agent work: Managed Agents deployment or Claude Code routine
- Type: comparison
- Applies to: Claude Code, Claude API
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Routines](https://code.claude.com/docs/en/routines), [Scheduled deployments](https://platform.claude.com/docs/en/managed-agents/scheduled-deployments), [Budgets](https://platform.claude.com/docs/en/managed-agents/budgets), [Pricing](https://platform.claude.com/docs/en/about-claude/pricing), [Managed Agents GitHub](https://platform.claude.com/docs/en/managed-agents/github)
- Related: ORCH-017, REPO-030, DOC-024, CAPI-013

| | Managed Agents deployment | Claude Code routine |
|---|---|---|
| Status | Beta | "research preview" |
| Billing | API tokens plus $0.08 per `running` session-hour; idle time is free | "Routines draw down subscription usage the same way interactive sessions do" |
| Interval | Cron to the minute, with jitter | "The minimum interval is one hour" |
| Count limits | 1,000 deployments per organisation | 100 scheduled runs an hour per account; 30 manual or API runs an hour per routine; "None of these hourly limits has overage" |
| Spend cap per run | Hard USD `budget` | None documented; bounded by plan usage |
| Secrets | Vault: write-only, substituted at egress | Environment variables "visible to anyone who uses the environment"; connectors attached by default |
| GitHub | `github_repository` resource with a fine-grained token | Your GitHub identity, pushes to `claude/` branches |
| Owner | Workspace (API key) | "your individual claude.ai account" |

**Choosing.** Repo upkeep that should act as you, such as our weekly docs-drift check (DOC-024), fits a routine: no extra spend on a subscription, and its own examples include "Docs drift". A deployment fits work that must run more often than hourly, needs a hard spend cap per run, keeps secrets from the model, or belongs to an API product. Pricing's worked example: a one-hour Opus 5.5 session with 50k input and 15k output tokens costs $0.58.

A routine run that shows green "does not mean the task in your prompt succeeded": read the transcript.

## Evaluation

## [CAPI-015] Evaluating an LLM feature: success criteria, test sets and graders
- Type: recommendation
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Define success criteria and build evaluations](https://platform.claude.com/docs/en/test-and-evaluate/develop-tests), [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) (2026-01-09)
- Related: SKILL-025, SKILL-028, JSTEST-013, PROMPT-028

**Order.** Define measurable success criteria first, then build evals against them. The docs' principles:
1. "Be task-specific": mirror the real task distribution, with edge cases (irrelevant, overly long, harmful or ambiguous input).
2. "Automate when possible."
3. "Prioritize volume over quality: More questions with slightly lower signal automated grading is better than fewer questions with high-quality human hand-graded evals."

**Graders**, fastest and most reliable first:
1. Code: exact or string match.
2. LLM-based: "Test to ensure reliability first then scale."
3. Human: "slow and expensive. Avoid if possible."

LLM graders need "detailed, clear rubrics" and an empirical output ("only 'correct' or 'incorrect', or … 1–5"). Run them with thinking on. The examples note it's "best practice to use a different model to evaluate than the model used to generate the evaluated output."

**For agents** (engineering post):
- "20-50 simple tasks drawn from real failures is a great start."
- Grade the outcome (the database row exists), not the transcript's claim. Checking an exact tool-call sequence is "too rigid": "grade what the agent produced, not the path it took."
- Report pass@k (at least one success in k tries) or pass^k (all k succeed) to fit the product: pass^k "for agents where consistency is essential".

Run evals on the target model before a migration (CAPI-001), since Anthropic advises testing replacements "well before the retirement date".

---

## Recommendations for our setup

Ranked by impact against effort. None of our public repos calls the Claude API or the Agent SDK on 2026-10-17, so these are rules for when one starts to, plus one decision about scheduled work.

1. **Keep scheduled repo upkeep on routines; don't move it to Managed Agents** (CAPI-014, CAPI-013). The weekly docs-drift routine (DOC-024) runs on subscription usage at no extra cost, and a deployment would add API tokens plus $0.08 per running hour. Revisit only if a job needs a hard spend cap per run, runs more often than hourly, or needs a secret the model must not see.
2. **When a repo first calls the API, pin these from day one** (CAPI-001, CAPI-002, CAPI-004, CAPI-009):
   - the model ID and an explicit `effort`;
   - no sampling parameters, prefill or forced `tool_choice`;
   - read blocks by `type`;
   - `strict: true` tools or `output_config.format` for machine-read output;
   - streaming for long outputs;
   - a cap on retries against spend-cap 429s.

   In Claude Code, `/claude-api migrate` does the per-model swaps.
3. **Scripted Claude runs stay on `claude -p --bare`** with `--max-turns`, `--max-budget-usd` and `--strict-mcp-config` (CAPI-011, MCP-012). Reach for the Agent SDK only for a service that needs approval callbacks or a session store. An SDK bump is a Claude Code upgrade, so read both CHANGELOGs.
4. **Before shipping an LLM feature, write its eval first** (CAPI-015): 20–50 cases from real inputs, code graders where possible, and an LLM grader on a different model with a rubric. Re-run it before each model migration.

No issue was opened in another repo: none of these needs a change there today.

## Open questions

- **Haiku 4.5's retirement.** The deprecations page still shows `claude-haiku-4-5-20251001` as Active, "Not sooner than October 15, 2026", two days after that date, with no deprecation entry (CAPI-003). Re-check the page.
- **Batch with Files.** Can a Message Batches request reference a `file_id`? Neither the Files nor the Batch processing page says (CAPI-010).
- **Managed Agents limits.** The API rate limits and what happens when a scheduled run starts while the previous session still runs (CAPI-013). `managed-agents/reference.md` wasn't read; the scheduled-deployments page has no overlap policy.
- **Per-run caps for routines.** None found on the routines page (CAPI-014).
- **Billing of SDK or `claude -p` runs on a subscription login**, outside the `--bare` and API-key path. The auth precedence allows it, and no page states how it counts (CAPI-011). `agent-sdk/cost-tracking.md` wasn't read for this.
- **Whether MCP credentials in a vault are visible to the model.** The vaults page says it for `environment_variable` credentials only (CAPI-013).
