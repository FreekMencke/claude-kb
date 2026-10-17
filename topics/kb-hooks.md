# Hooks

Prefix: HOOK. Researched 2026-10-12 on Claude Code v2.1.296 and the docs live that day; re-verified 2026-10-14 against the docs fetched that day, the claude-code CHANGELOG through 2.1.299 and our repos' `origin/main` (each entry's Last verified date is authoritative). This file covers how to write, scope, debug, secure and price a Claude Code hook. Uses of hooks covered elsewhere are linked, not repeated: forced-review hooks (REPO-025), output-filtering hooks (TOK-042), blocking large reads (TOK-044), orchestration hooks (ORCH-019), forced skill evaluation (SKILL-029), settings merging (REPO-006) and workspace trust for agent frontmatter (REPO-007). Docs pages were read in full as `.md` (`curl -sL https://code.claude.com/docs/en/hooks.md`); version numbers come from the claude-code CHANGELOG.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Which hook event do I need? | `PreToolUse` to block or rewrite a tool call, `PostToolUse` to react to one, `UserPromptSubmit` per prompt, `Stop` per turn end, `SessionStart` for context at start, `Notification` for alerts. 33 events in all. | HOOK-001, HOOK-002 |
| How does a hook block something? | Exit 2 with the reason on stderr, or exit 0 with JSON (`permissionDecision: "deny"` on PreToolUse, `decision: "block"` elsewhere). Exit 1 does **not** block. | HOOK-004, HOOK-005, HOOK-006 |
| What does a hook get on stdin? | JSON with `session_id`, `transcript_path`, `cwd`, `permission_mode`, `hook_event_name`, plus event fields such as `tool_name` and `tool_input`. `cwd` follows worktrees; `$CLAUDE_PROJECT_DIR` doesn't. | HOOK-003 |
| `command`, `http`, `mcp_tool`, `prompt` or `agent`? | `command` for nearly everything. `prompt` and `agent` call a model on every match and are slower; `agent` is experimental. | HOOK-009, HOOK-010 |
| What does a hook cost? | A command hook costs 4–7 ms and no tokens unless it returns text. A `prompt` hook is a Haiku call per match; on Stop it re-reads the whole conversation uncached (+14k tokens on a short session). An `agent` hook runs up to 50 turns. | HOOK-015, HOOK-010 |
| What happens when a hook crashes or times out? | It fails open: the action goes ahead. Set `onFailure: "block"` (v2.1.295+) for a policy hook that must fail closed. Since v2.1.299 a plugin hook that can't be handed the action or can't answer fails closed. | HOOK-013, HOOK-012 |
| Where do I define hooks and how do they combine? | User, project, local and managed settings, plugin `hooks/hooks.json`, skill and agent frontmatter. They merge; all matching hooks run in parallel and the strictest decision wins. | HOOK-016, HOOK-014, REPO-006 |
| How do I run a hook only for some commands? | `matcher` filters on the tool name (case-sensitive); the `if` field filters on arguments with permission-rule syntax, e.g. `Bash(git *)`. `if` is best-effort, not a security boundary. | HOOK-018, HOOK-019 |
| Do my hooks run in the desktop app, cloud sessions and `-p`? | Desktop and IDEs read the same settings files. Cloud sessions skip `~/.claude/settings.json`. `-p` runs repo hooks without a trust dialog. | HOOK-017, HOOK-025 |
| How do I debug a hook? | `claude --debug-file /tmp/c.log`, then grep for `Hooks:` lines with durations (v2.1.296+). Test the script alone by piping sample JSON into it. | HOOK-022, HOOK-023 |
| My hook "does nothing". Why? | Shell profile echoes before the JSON, a field outside `hookSpecificOutput`, wrong matcher case, exit 1 instead of 2, or one invalid matcher dropping the whole file's hooks. | HOOK-024 |
| Is a hook a security boundary? | No. Hooks run with your full permissions and parse text the model wrote. Hard limits belong in deny rules and the sandbox. | HOOK-025, HOOK-026 |
| Which proven hooks should I copy? | Format after edit, block dangerous commands or protected files, context at SessionStart, notifications, a Stop gate with a loop guard. | HOOK-027–HOOK-031 |
| What hooks do we run? | Prettier after edit and a lint-before-push gate in the three osrs-tracker repos, each parsing the command in `pre-push-check.sh`; all three filter it with `"if": "Bash(git *)"`. At user level only a `SessionStart` worktree fast-forward hook. | HOOK-036 |

## Index

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

---

## [HOOK-001] Session, turn and tool-loop events
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Hooks reference: lifecycle, matcher patterns, exit code 2 per event](https://code.claude.com/docs/en/hooks)
- Related: HOOK-002, HOOK-004, ORCH-019

Cadence: `SessionStart`/`SessionEnd` per session, `UserPromptSubmit`/`Stop`/`StopFailure` per turn, `PreToolUse`/`PostToolUse` on every tool call (`EndConversation` skips both). `UserPromptSubmit` also fires for scheduled tasks, `/loop` iterations, background-subagent reports and cross-session messages, and since v2.1.299 it runs before a skill or custom slash command expands, so blocking the prompt also stops its embedded shell lines. "Blocks" = exit 2 or a JSON decision stops the action.

| Event | Fires | Matcher on | Blocks? |
|---|---|---|---|
| `SessionStart` | Session begins or resumes | `startup`, `resume`, `clear`, `compact`, `fork` | No |
| `Setup` | `--init-only`, or `--init`/`--maintenance` with `-p` | `init`, `maintenance` | No |
| `UserPromptSubmit` | Prompt submitted, before Claude sees it | none | Yes |
| `UserPromptExpansion` | A typed `/command` expands | command name | Yes |
| `PreToolUse` | Before a tool runs | tool name | Yes |
| `PermissionRequest` | A permission prompt would show | tool name | Via JSON `decision` only |
| `PermissionDenied` | Auto mode denies a call | tool name | No (`retry: true`) |
| `PostToolUse` / `PostToolUseFailure` | Tool succeeded / failed | tool name | No; stderr goes to Claude |
| `PostToolBatch` | A parallel batch resolved | none | Yes, stops the loop |
| `MessageDisplay` | Assistant text streams | none | No (display-only rewrite) |
| `Stop` | Claude finishes responding (not on interrupt) | none | Yes, keeps Claude working |
| `StopFailure` | Turn ended by an API error | error type | No, output ignored |
| `SessionEnd` | Session terminates | `clear`, `resume`, `logout`, `prompt_input_exit`, `other` | No |

Key input fields: `PreToolUse` gets `tool_name`, `tool_input`, `tool_use_id`; `PostToolUse` adds `tool_response` and `duration_ms`; `Stop` gets `stop_hook_active`, `last_assistant_message`, `background_tasks`, `session_crons`; `UserPromptSubmit` gets `prompt`.

## [HOOK-002] Agent, environment and lifecycle events
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Hooks reference: lifecycle, matcher patterns, exit code 2 per event](https://code.claude.com/docs/en/hooks), [Claude Code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: HOOK-001, ORCH-019

| Event | Fires | Matcher on | Blocks? |
|---|---|---|---|
| `SubagentStart` / `SubagentStop` | Subagent spawned / finishes | agent type | Stop: yes |
| `TaskCreated` / `TaskCompleted` | `TaskCreate` / task marked done | none | Yes |
| `TeammateIdle` | Agent-team teammate about to idle | none | Yes |
| `Notification` | Claude Code sends a notification | `permission_prompt`, `idle_prompt`, `agent_needs_input`, … | No |
| `InstructionsLoaded` | CLAUDE.md or a rule file loads | load reason | No |
| `ConfigChange` | A settings or skill file changes | source | Yes, except `policy_settings` |
| `CwdChanged` | Working directory changes | none | No |
| `DirectoryAdded` | `/add-dir` mid-session | `slash_command`, `register_repo_root` | No |
| `FileChanged` | A watched file changes | literal filenames | No |
| `WorktreeCreate` / `WorktreeRemove` | Worktree made / removed; replaces git behaviour | none | Any non-zero exit fails it |
| `PreCompact` / `PostCompact` | Around compaction | `manual`, `auto` | Pre: yes |
| `PreModelSwitch` / `PostModelSwitch` | Around a model switch (v2.1.251+) | canonical model name | Pre: yes; a timeout also blocks |
| `Elicitation` / `ElicitationResult` | MCP server asks for user input | MCP server name | Yes (declines) |

Key input fields: `TaskCreated`/`TaskCompleted` get `task_id`, `task_subject`, optional `task_description`, `teammate_name`, `team_name`; `TeammateIdle` gets `teammate_name`, `team_name`; `SubagentStop` adds `agent_transcript_path` and `last_assistant_message`.

Versions from the CHANGELOG: `SubagentStart` 2.0.43, `PermissionRequest` 2.0.45, `TeammateIdle`/`TaskCompleted` 2.1.33, `ConfigChange` 2.1.49, worktree events 2.1.50, `InstructionsLoaded` 2.1.69, `PostCompact` and elicitation events 2.1.76, `StopFailure` 2.1.78, `CwdChanged`/`FileChanged` 2.1.83, `TaskCreated` 2.1.84, `PermissionDenied` 2.1.89, `MessageDisplay` 2.1.152, `DirectoryAdded` 2.1.219.

## [HOOK-003] Common input fields and hook environment variables
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Hooks reference: common input fields, reference scripts by path](https://code.claude.com/docs/en/hooks)
- Related: HOOK-008, HOOK-036

Every hook gets JSON on stdin (HTTP hooks: the POST body) with:
- `session_id`, `prompt_id`, `hook_event_name`, `cwd`, `permission_mode`, `scratchpad_dir` (v2.1.257+), `effort.level` on tool-context events.
- `transcript_path`: "written asynchronously and may lag". On Stop and SubagentStop read `last_assistant_message` instead.
- `agent_id` and `agent_type` when the hook fires inside a subagent or under `--agent` (v2.1.69+). Settings, managed and plugin hooks also run for subagents' tool calls.
- `model` only on SessionStart, and not always. There is no `$CLAUDE_MODEL`; use `PostModelSwitch` to track switches.

Environment:
- `CLAUDE_PROJECT_DIR`: the project root where the session started. It **stays put** when Claude enters a worktree or runs `cd`; the `cwd` input field follows Claude. A hook that must act on the checkout Claude is working in should read `cwd`.
- `CLAUDE_PLUGIN_ROOT`, `CLAUDE_PLUGIN_DATA`, `CLAUDE_PLUGIN_OPTION_<KEY>` for plugin hooks.
- `CLAUDE_ENV_FILE` on SessionStart, Setup, CwdChanged and FileChanged (HOOK-008).
- `CLAUDE_CODE_REMOTE="true"` in cloud sessions; `CLAUDE_EFFORT`.
- Hooks inherit the parent environment minus `OTEL_*` exporter variables; `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1` strips credentials too.
- Hooks have no controlling terminal, so `/dev/tty` fails (use `terminalSequence`, HOOK-030).

## [HOOK-004] Exit codes and stdout: how a run resolves
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Hooks reference: exit code output](https://code.claude.com/docs/en/hooks#exit-code-output), [examples/hooks/bash_command_validator_example.py](https://github.com/anthropics/claude-code/blob/main/examples/hooks/bash_command_validator_example.py)
- Related: HOOK-005, HOOK-013, HOOK-024

| Stdout | Exit 0 | Exit 2 | Other exit |
|---|---|---|---|
| Valid JSON object | Success; fields apply | Blocks; fields read but can't override the block | Success; JSON decides (exit code ignored) |
| Invalid or schema-failing JSON | Non-blocking error | Blocks; stderr is the reason | Non-blocking error |
| Plain text or nothing | Success | Blocks; stderr is the reason | Non-blocking error |

- **Exit 1 doesn't block.** "Without valid JSON on stdout, Claude Code treats exit code 1 as a non-blocking error… If your hook is meant to enforce a policy, use `exit 2`." The official validator example's comments still describe exit 1 as user-only feedback, consistent with this.
- **Exit 0 with no output on PreToolUse is "no decision", not approval**: the normal permission flow continues.
- **Stdout:** for most events it goes to the debug log only. On `UserPromptSubmit`, `UserPromptExpansion`, `SessionStart` and `PostModelSwitch` plain stdout becomes context Claude sees.
- **Stderr:** Claude never sees it on exit 0. On exit 2 it is the block reason, shown as `PreToolUse:Bash hook error: [<command>]: <stderr>`. A non-blocking error shows the first stderr line in the transcript.
- **Exceptions:** `WorktreeCreate` fails on any non-zero exit; `PermissionRequest` ignores exit 2 (deny with the JSON `decision` object); `Notification`, `Setup`, `InstructionsLoaded`, `StopFailure` ignore the exit code.
- HTTP hooks can't block via status code: a non-2xx is a non-blocking error. Return a 2xx JSON decision instead.

## [HOOK-005] JSON output fields and the 10,000-character cap
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Hooks reference: JSON output, decision control](https://code.claude.com/docs/en/hooks#json-output), [Claude Code CHANGELOG 2.1.89](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: HOOK-004, HOOK-006, HOOK-007, TOK-042

Print **only** one JSON object on stdout and exit 0.

Universal fields: `continue: false` (+ `stopReason`) stops Claude entirely and beats every decision field; `systemMessage` warns the user; `terminalSequence` emits a notification escape (HOOK-030). `suppressOutput` "has no effect" today.

Decision patterns:
- Top-level `decision: "block"` + `reason`: UserPromptSubmit, UserPromptExpansion, PostToolUse, PostToolUseFailure, PostToolBatch, Stop, SubagentStop, ConfigChange, PreCompact, TaskCreated. `"block"` is the only value; omit it to allow.
- `hookSpecificOutput` (with `hookEventName`): PreToolUse (`permissionDecision`, `updatedInput`), PermissionRequest (`decision.behavior`, `updatedPermissions`), PreModelSwitch, Elicitation, MessageDisplay (`displayContent`).
- Context only: SessionStart, SubagentStart, PostModelSwitch.
- Rewrites: PreToolUse `updatedInput` (replaces the whole input), PostToolUse `updatedToolOutput` (only what Claude sees; the tool already ran). UserPromptSubmit can't rewrite the prompt.

**Cap:** "A hook's `additionalContext`, `systemMessage`, and `initialUserMessage` strings, and its plain stdout, are capped at 10,000 characters". Each string is measured separately. Over the cap, the text is saved to a file and replaced with its path and a preview of up to 2,000 characters; "Claude Code doesn't ask Claude to read the file", and "this cap has no setting or environment variable to raise it". Keep anything Claude must see under 10,000 characters.

Deprecated: top-level `decision: "approve"/"block"` on PreToolUse (maps to allow/deny).

## [HOOK-006] PreToolUse decisions and how they meet permission rules
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Hooks reference: PreToolUse decision control](https://code.claude.com/docs/en/hooks#pretooluse-decision-control), [Hooks guide: hooks and permission modes](https://code.claude.com/docs/en/hooks-guide#hooks-and-permission-modes), [Permissions: extend permissions with hooks](https://code.claude.com/docs/en/permissions#extend-permissions-with-hooks)
- Related: HOOK-014, HOOK-026, REPO-034, TOK-042

`permissionDecision` values:
- `"deny"`: blocks; `permissionDecisionReason` goes to Claude. Works "even in `bypassPermissions` mode or with `--dangerously-skip-permissions`", because PreToolUse fires before any permission-mode check.
- `"ask"`: forces a prompt, labelled `[settings]`, `[plugin:<name>]` or `[skill]`. In auto mode the classifier can still deny but can't approve silently.
- `"allow"`: skips the prompt, but "Deny and ask rules are still evaluated regardless of what the hook returns". It can't skip prompts for network-path reads or `requiresUserInteraction` MCP tools; `AskUserQuestion` and `ExitPlanMode` need `updatedInput` with it.
- `"defer"`: only in `-p` with a single tool call; the run exits with `stop_reason: "tool_deferred"` for a calling app to resume.

Rules:
- An exit-2 block beats allow rules. The documented recipe: allow `"Bash"` broadly and block a few commands with a hook.
- A hook can tighten permission rules but not loosen them.
- `updatedInput` replaces the entire input; permission rules are evaluated against the rewritten input (since v2.1.290 all safety checks are). Several hooks returning `updatedInput` race: "the last one to finish takes effect".
- An installed mod's `tool.check` can approve a call a non-managed PreToolUse hook blocked (HOOK-035).

## [HOOK-007] `additionalContext`: where it lands and how to word it
- Type: pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Hooks reference: add context for Claude](https://code.claude.com/docs/en/hooks#add-context-for-claude)
- Related: HOOK-005, HOOK-008, HOOK-029, TOK-065

`hookSpecificOutput.additionalContext` is wrapped in a system reminder and inserted where the hook fired:
- SessionStart, SubagentStart: start of the conversation.
- UserPromptSubmit, UserPromptExpansion: alongside the prompt.
- PreToolUse, PostToolUse, PostToolUseFailure, PostToolBatch: next to the tool result.
- Stop, SubagentStop: end of the turn; the conversation continues.
- PostModelSwitch: with the next request.

Values from several hooks are all delivered. `<system-reminder>` tags inside are escaped.

How to write it:
- **Facts, not orders.** "Write the text as factual statements rather than imperative system instructions… Text framed as out-of-band system commands can trigger Claude's prompt-injection defenses".
- **Dynamic only.** For instructions that never change, use CLAUDE.md, which loads without a script.
- **Small.** Under the 10,000-character cap (HOOK-005). Every injection is re-read on every later turn, like any other context (TOK-008).
- **It goes stale on resume.** Mid-session injections are saved in the transcript and replayed on `--resume`, not re-run, so timestamps and SHAs go stale. SessionStart re-runs on resume (`source: "resume"`) and can refresh.

## [HOOK-008] SessionStart outputs and `CLAUDE_ENV_FILE`
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Hooks reference: SessionStart](https://code.claude.com/docs/en/hooks#sessionstart)
- Related: HOOK-007, HOOK-029, HOOK-003

SessionStart takes only `command` and `mcp_tool` handlers, and `mcp_tool` hooks are skipped at launch because MCP servers aren't connected yet. "SessionStart runs on every session, so keep these hooks fast."

Outputs:
- Plain stdout or `additionalContext`: added to Claude's context.
- `initialUserMessage`: the first user turn, in `-p` only.
- `sessionTitle`: like `/rename`.
- `watchPaths`: absolute paths to watch for `FileChanged`.
- `reloadSkills: true`: re-scan skill directories after the hooks finish, for skills the hook just installed.

Timing: interactive sessions run SessionStart hooks in the background so you can type at once, but "Claude's first response still waits for the hooks to finish". A slow SessionStart hook delays every first answer.

`CLAUDE_ENV_FILE` (SessionStart, Setup, CwdChanged, FileChanged): append `export VAR=…` lines and later Bash commands see them. Use `>>` so you don't overwrite other hooks' lines. CwdChanged/FileChanged variables are cleared at the next CwdChanged. The documented direnv pattern is `direnv export bash > "$CLAUDE_ENV_FILE"` on SessionStart and CwdChanged.

## [HOOK-009] The five handler types and which events take them
- Type: comparison
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Hooks reference: hook handler fields, prompt-based hooks](https://code.claude.com/docs/en/hooks#hook-handler-fields), [Claude Code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: HOOK-010, HOOK-011, REPO-025, SKILL-023

| Type | What runs | Default timeout | Added |
|---|---|---|---|
| `command` | Shell (`sh -c`) or, with `args`, an exec-form process | 600 s | original |
| `http` | POST of the input JSON; response body is the JSON output | 600 s | 2.1.63 |
| `mcp_tool` | A tool on a configured MCP server; its text is treated as stdout | 600 s | 2.1.118 |
| `prompt` | One model call returning `{ok, reason}` | 30 s | 2.0.30 (Stop) |
| `agent` | A subagent with Read, Grep, Glob, up to 50 turns. Experimental | 60 s | 2.1.0-era |

Event support:
- All five: PreToolUse, PostToolUse, PostToolUseFailure, PostToolBatch, PermissionDenied, Stop, SubagentStop, TaskCreated, TaskCompleted, TeammateIdle, UserPromptSubmit, UserPromptExpansion.
- `PermissionRequest`: all but `agent`.
- `SessionStart`, `Setup`: `command` and `mcp_tool` only.
- All other events: `command`, `http`, `mcp_tool`.

Choosing:
- **`command`** for nearly everything: deterministic, cheap, testable.
- **`http`** for a central policy or logging service. Header env vars must be listed in `allowedEnvVars`; admins can restrict URLs with `allowedHttpHookUrls`.
- **`mcp_tool`** to reuse a scanner you already run as MCP.
- **`prompt`/`agent`** only where judgement is needed and a miss is costly (REPO-025). "For production workflows, prefer command hooks."
- `async`, `asyncRewake` and `onFailure` exist on `command` (and `onFailure` on `http`) only.

## [HOOK-010] Prompt and agent hooks: behaviour and cost
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Hooks reference: prompt-based hooks, agent-based hooks](https://code.claude.com/docs/en/hooks#prompt-based-hooks), [Costs: background token usage](https://code.claude.com/docs/en/costs#background-token-usage), [Claude Code CHANGELOG 2.1.294, 2.1.295](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: HOOK-009, HOOK-015, REPO-025, SKILL-029

**Prompt hooks:** the prompt (with `$ARGUMENTS` replaced by the input JSON, or the JSON appended) goes to "the model Claude Code uses for background functionality" unless `model` is set. The model answers `{"ok": bool, "reason": "...", "impossible": bool}`.
- On `ok: false`: Stop/SubagentStop feed the reason back and continue (unless `impossible: true`). PreToolUse denies and by default **ends the turn**; `continueOnBlock: true` returns the reason to Claude instead (behaviour changed in v2.1.210). PermissionRequest and PermissionDenied ignore it.
- Write the prompt as a rule or a condition; v2.1.294 fixed hooks written as instructions allowing what they should block.

**Agent hooks:** a subagent with Read, Grep and Glob, up to 50 turns, then `{ok}`. Handled like a prompt hook with `continueOnBlock: true`. "Experimental… For production workflows, prefer command hooks."

**Cost:** the docs give no per-hook price. Tested 2026-10-12, v2.1.296, `claude -p --output-format json`, Haiku session, 3–5 runs per variant:
- The background model was `claude-haiku-5-5`, even with the session on Sonnet.
- A **Stop** prompt hook sends the conversation ("Based on the conversation transcript above…"), uncached: +14k cache-write tokens on a short session, +42k after adding about 30k tokens, adding about 1–2 s per turn end. Its cost is in `total_cost_usd` and `modelUsage`, not the top-level `usage`.
- A **UserPromptSubmit** prompt hook sees little context: about +0.5k tokens, under 1 s.
- An **agent** hook added 1–2 s; its tokens appeared nowhere in the JSON output.

**`/goal`** is "a built-in shortcut for a session-scoped prompt-based Stop hook". Use it before writing one by hand.

## [HOOK-011] Async and `asyncRewake` hooks
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Hooks reference: run hooks in the background](https://code.claude.com/docs/en/hooks#run-hooks-in-the-background), [Claude Code CHANGELOG 2.1.295](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: HOOK-012, HOOK-033

`"async": true` (command hooks only) starts the hook and continues without waiting.
- It **can't block or decide**: `decision`, `permissionDecision` and `continue` have no effect.
- When it exits, its `additionalContext` and `systemMessage` go to Claude **on the next turn**, and aren't shown to you. If the session is idle, they wait for the next interaction.
- `timeout` isn't enforced on it once it runs in the background.
- In `-p`, still-running async hooks are killed at teardown (`cancelled`). Start a detached process if the work must outlive the run.
- Print the JSON alone on stdout, or on one line of its own (`jq -c`). Multi-line JSON from async hooks works from v2.1.295.
- Completion notices are hidden unless verbose (`Ctrl+O` or `--verbose`).

`"asyncRewake": true` runs in the background and, on exit 2, **wakes Claude immediately** with the hook's stderr (or stdout) as a system reminder, even when the session is idle. `timeout` is enforced.

Use async for slow feedback that shouldn't stall the turn: a test suite after an edit (the docs' `run-tests-async.sh` example), a remote scan. The official `security-guidance` plugin runs its model review on `Stop` with `asyncRewake`, keeping it off the per-edit path.

## [HOOK-012] Timeouts per handler type and event
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Hooks reference: common fields, timeouts](https://code.claude.com/docs/en/hooks#common-fields), [Hooks guide: limitations](https://code.claude.com/docs/en/hooks-guide#limitations), [anthropics/claude-code#85250](https://github.com/anthropics/claude-code/issues/85250), [Hooks reference: hooks that start a background process](https://code.claude.com/docs/en/hooks), [Claude Code CHANGELOG 2.1.285](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: HOOK-011, HOOK-013, HOOK-033

`timeout` is in seconds, per handler.

| Handler | Default |
|---|---|
| `command`, `http`, `mcp_tool` | 600 s; 30 s on `UserPromptSubmit`, `PreModelSwitch`, `PostModelSwitch`; 10 s on `MessageDisplay` |
| `prompt` | 30 s |
| `agent` | 60 s |
| `SessionEnd` (any type) | Shared 1.5 s budget, raised to the largest per-hook `timeout` up to 60 s (also `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS`) |

On timeout a `command`, `http` or `mcp_tool` hook is cancelled and its output discarded, so it **renders no decision**: a timed-out PreToolUse hook "doesn't block the tool call… don't count on a stalled hook to act as a gate". Exceptions: a PreModelSwitch timeout blocks the switch; an Agent SDK callback hook that times out blocks. Add `onFailure: "block"` to make a timeout block (HOOK-013).

**Background children:** a stall (the hook exits, a detached child keeps stdout open) was reproduced on v2.1.233 and fixed in v2.1.285 (not retested). Claude Code now "finishes reading the hook's output shortly after the hook's own process exits", so a decision the child prints later doesn't count, and a hook that prints an allow and then starts an unredirected background process is blocked (`refusing to honor the suspect capture`). Print the decision first and start children with `>/dev/null 2>&1 &`, or use `async: true`. anthropics/claude-code#85250 (a wedged hook subprocess ignoring `timeout`, Windows) is still open.

Set an explicit, tight `timeout` on anything on a hot path; the 10-minute default is generous.

## [HOOK-013] Hooks fail open by default; `onFailure: "block"`
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Hooks reference: block the action when a hook fails](https://code.claude.com/docs/en/hooks#block-the-action-when-a-hook-fails), [Claude Code CHANGELOG 2.1.295](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: HOOK-004, HOOK-012, HOOK-024

"On most events, when a hook fails or times out, Claude Code still carries out the action, so a policy hook with a wrong path or a crashing script lets everything through." A missing script exits 127, which is just a `hook error` notice: "a mistyped path in `settings.json` means the hook never runs."

`"onFailure": "block"` (v2.1.295+, `command` and `http` only) turns these into a block:
- can't start (missing script or executable),
- exit code other than 0 or 2, even with JSON that allows,
- HTTP connection failure or non-2xx,
- timeout,
- unparseable or schema-failing output (plain-text stdout is fine).

Tested 2026-10-12, v2.1.296, `-p`: a `sleep 6` PreToolUse hook with `timeout: 2` let the tool run; with `onFailure: "block"` the call was blocked (`timed out; blocking because onFailure is "block"`).

With it set, a failure does what exit 2 does on that event; on PermissionRequest it denies. It has no effect on Stop, SubagentStop, TaskCompleted, TeammateIdle ("Claude can't repair a hook that won't run") or async hooks.

Already blocked without `onFailure`: a PreToolUse or PermissionRequest hook whose matching fails or whose tool input can't be serialized to JSON (v2.1.288), and on Windows one with no shell set when Git for Windows is missing (v2.1.299). Since v2.1.299 an action a plugin hook can block is refused when the hook can't be handed it or can't hand back its answer; the hooks page still calls such failures non-blocking (INDEX Conflicts).

When to use it: a hook that is the **only** guard for something that matters (secrets, production). Not for a convenience hook on every Bash call: if its script breaks, every Bash call is blocked until you fix it. Test the first run either way.

## [HOOK-014] Parallel runs, deduplication and combined decisions
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Hooks reference: hook handler fields](https://code.claude.com/docs/en/hooks#hook-handler-fields), [Hooks guide: combine results from multiple hooks](https://code.claude.com/docs/en/hooks-guide#combine-results-from-multiple-hooks)
- Related: HOOK-006, HOOK-016, REPO-006

- **Parallel.** "All matching hooks run in parallel." Every hook "runs to completion before Claude Code merges the results"; one hook's deny doesn't stop a sibling's side effects (a logger still logs).
- **Dedup.** The same handler in several settings files runs once. "A plugin's or skill's copy of the same handler stays separate."
- **Merging.** PreToolUse: most restrictive wins, `deny` > `defer` > `ask` > `allow`. `additionalContext` from every hook is delivered.
- **`updatedInput` races.** With several rewriting hooks "the last one to finish takes effect… non-deterministic. Avoid having more than one hook modify the same tool's input."
- **No ordering.** There is no priority or sequence field. If step B needs step A's result, put both in one script.
- **Working directory.** Handlers run in the current directory; if it was deleted, Claude Code falls back to the start directory, project root, home, then temp, and logs a warning.

Tested 2026-10-12, v2.1.296, terminal `-p` (Haiku): four handlers in one matcher group finished within 1 ms of each other.

## [HOOK-015] The cost of a hook on every tool call
- Type: fact
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-14
- Sources: [Hooks reference: how a hook resolves, debug hooks](https://code.claude.com/docs/en/hooks#how-a-hook-resolves), [Claude Code CHANGELOG 2.1.85](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: HOOK-010, HOOK-019, TOK-042, TOK-008

**Command hooks** cost wall-clock time, not tokens, unless they return text. Their output enters context only via plain stdout on the four context events, `additionalContext`, or exit-2 stderr (HOOK-004). Every injected character is then re-read on every later turn (TOK-008).

Local measurement, 2026-10-12, this machine (WSL2), `scratchpad/lead/time_hooks.sh`, 50 runs each, script time excluding Claude Code's own spawn:
- empty `sh -c` hook: about 1 ms;
- osrs-tracker-web `pre-push-check.sh` on a non-push command (bash, `cat` and one `jq`): about 4 ms;
- inline Prettier hook on a file outside the project: about 2 ms;
- `prettier --check` on one file: about 83 ms (5 runs).
Probes 2026-10-12, v2.1.296, `-p`: the debug log reported 4–7 ms per trivial hook per call, end to end. A PostToolUse hook returning about 900 tokens of `additionalContext` on each of 3 Bash calls raised the run's cost by about 36%.

So a cheap command hook on every Bash call adds a few ms; the real costs are slow work (formatters, tests, network), injected text and model calls.

**Cutting cost:**
- `if` (v2.1.85, "reducing process spawning overhead") skips the spawn when arguments don't match (HOOK-019).
- `async: true` for slow feedback (HOOK-011).
- Tight `timeout`s.
- No `prompt`/`agent` hooks on PreToolUse or PostToolUse (HOOK-010).

Confidence note: behaviour is official-docs; the timings are our measurement.

## [HOOK-016] Where hooks are defined
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Hooks reference: hook locations, configuration](https://code.claude.com/docs/en/hooks#hook-locations), [Plugins reference: hooks](https://code.claude.com/docs/en/plugins-reference), [Permissions: working directories](https://code.claude.com/docs/en/permissions), [Settings](https://code.claude.com/docs/en/settings)
- Related: REPO-005, REPO-006, REPO-040, HOOK-020

Structure: event → matcher groups → handlers.
```json
{"hooks":{"PreToolUse":[{"matcher":"Bash","hooks":[{"type":"command","command":"..."}]}]}}
```

| Location | Scope |
|---|---|
| `~/.claude/settings.json` | All your projects |
| `.claude/settings.json` | The project; commit it to share |
| `.claude/settings.local.json` | The project, you only |
| Managed policy settings | Organization; can't be disabled from lower levels |
| Plugin `hooks/hooks.json`, or `hooks` in `plugin.json` (file path, inline object or both) | While the plugin is enabled; registered at load, not on first use |
| Skill frontmatter | From invocation to session end (HOOK-020) |
| Agent frontmatter | While that subagent runs (HOOK-020) |
| `--settings <file or JSON>` | That run |

Gotchas:
- Project `.claude/settings.json` hooks load from the **current working directory's** `.claude/` with "no parent-directory fallback". Start Claude in a subdirectory and the repo's hooks don't load (`settings.local.json` does load from the repo root).
- Plugin agents ignore their `hooks` field; use the plugin's `hooks.json` (REPO-040).
- There's no standalone hooks file; `~/.claude.json` isn't for hooks.
- Agent SDK apps add in-process callback hooks via `options.hooks`, which keep running under `disableAllHooks`.

## [HOOK-017] Hooks by surface: terminal, desktop, cloud, `-p`, action, SDK
- Type: comparison
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Hooks reference: hook locations, workspace trust](https://code.claude.com/docs/en/hooks), [Settings: settings in cloud sessions](https://code.claude.com/docs/en/settings), [Desktop: shared configuration](https://code.claude.com/docs/en/desktop), [claude-code-action configuration](https://github.com/anthropics/claude-code-action/blob/main/docs/configuration.md), [claude-code-action security](https://github.com/anthropics/claude-code-action/blob/main/docs/security.md)
- Related: HOOK-025, REPO-007, REPO-028

"Claude Code fires the same hook events wherever it runs." What differs is which settings load:

| Surface | User `~/.claude` hooks | Repo `.claude/settings.json` hooks | Notes |
|---|---|---|---|
| Terminal, IDE | Yes | Yes, after the trust dialog | VS Code has an editable Hooks dialog (v2.1.269) |
| Desktop Code tab | Yes ("Desktop and CLI read the same configuration files") | Yes | `permission_prompt` Notification fires about 6 s after the request. `/hooks` availability undocumented |
| Cloud session, one repo | **No** | Yes | Repo-enabled plugins don't load; `CLAUDE_CODE_REMOTE=true` |
| Cloud session, several repos | No | **No** (only `enabledPlugins`, `extraKnownMarketplaces` read) | |
| `claude -p`, SDK | Yes | Yes, **with no trust dialog** | `terminalSequence` ignored; async hooks killed at exit |
| `claude-code-action` | Runner's | Yes; plus a `settings` input that takes `hooks` | On PRs, `.claude/` is restored from the base branch but `package.json` and scripts stay at the PR head |

Consequences:
- A hook that must hold in cloud sessions goes in the repo's `.claude/settings.json`, not in `~/.claude`.
- In the action, a base-branch hook that runs `npm run …` executes PR-controlled code; the action's docs advise pinned, self-contained commands (REPO-028).

## [HOOK-018] Matcher syntax
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Hooks reference: matcher patterns, match MCP tools](https://code.claude.com/docs/en/hooks#matcher-patterns), [Hooks guide: hook not firing](https://code.claude.com/docs/en/hooks-guide#hook-not-firing), [Debug your config](https://code.claude.com/docs/en/debug-your-config)
- Related: HOOK-019, HOOK-001, HOOK-024

| Matcher | Read as |
|---|---|
| `"*"`, `""`, omitted | Match all |
| Only letters, digits, `_`, `-`, spaces, `,`, `\|` | Exact name, or a list split on `\|` or `,` |
| Any other character | Unanchored JavaScript regex |

- **Case-sensitive.** `bash` never matches `Bash` (tested 2026-10-12, v2.1.296).
- **Regex is unanchored.** `Edit.*` also matches `NotebookEdit`; write `^Edit$`.
- **MCP tools** are `mcp__<server>__<tool>`. `mcp__memory` alone is an exact string and matches nothing; use `mcp__memory__.*`. Plugin MCP tools are `mcp__plugin_<plugin>_<server>__<tool>`.
- **Plugin agents** in SubagentStart/Stop are `plugin:agent`; the colon makes it regex, so anchor it: `^my-plugin:reviewer$`.
- **Events without matcher support** (UserPromptSubmit, Stop, PostToolBatch, TaskCreated, TaskCompleted, TeammateIdle, Worktree*, MessageDisplay, CwdChanged) silently ignore a matcher; filter in the script.
- **Use canonical tool names**, not transcript labels (`TaskStop`, not `Stop Task`).
- **History:** `,` as a separator since v2.1.191; hyphenated names exact-match since v2.1.195.
- Matchers see only the tool name. Filter on arguments with `if` (HOOK-019) or in the script.

## [HOOK-019] The `if` field: filtering on tool arguments
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Hooks reference: common fields, how `if` patterns match Bash commands](https://code.claude.com/docs/en/hooks#bash-if-matching), [Permissions: Bash rule limits](https://code.claude.com/docs/en/permissions), [Claude Code CHANGELOG 2.1.85](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: HOOK-018, HOOK-015, HOOK-036, REPO-034

`if` (v2.1.85+) holds **one** permission rule, such as `"Bash(git *)"` or `"Edit(*.ts)"`. The handler spawns only when the tool call matches, saving the process spawn.

- **Tool events only:** PreToolUse, PostToolUse, PostToolUseFailure, PermissionRequest, PermissionDenied. "On other events, a hook with `if` set never runs."
- **No combining:** no `&&`, `||` or lists; use one handler per rule.
- **Bash matching:** leading `VAR=value` is stripped; each subcommand of `a && b` is checked; commands inside `$()` and backticks are checked. Patterns longer than the command name run the hook anyway on `$()`, backticks or `$VAR`. "When Claude Code can't determine which commands the Bash input runs, it runs your hook regardless."
- **It misses option prefixes.** Per the permissions page, `Bash(git push *)` doesn't match `git -C . push`, `git -c k=v push` or `git 'push'`. Tested 2026-10-12, v2.1.296, `-p`: `if: Bash(git status *)` skipped `git -C . status --short`, while `Bash(git *)` ran.
- **Paths:** `Edit(src/**)` matches only `./src` since v2.1.214; use `Edit(**/src/**)` for any depth.

"Because the `if` filter is best-effort, use the permission system rather than a hook to enforce a hard allow or deny."

Pattern: filter broadly with `if` (`Bash(git *)`) and do the exact parsing in the script. The official `security-guidance` plugin lists `git commit:*` and `git -C * commit *` (plus push and Graphite forms) as separate handlers for the same reason.

## [HOOK-020] Hooks in skill and agent frontmatter
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Hooks reference: hooks in skills and agents](https://code.claude.com/docs/en/hooks#hooks-in-skills-and-agents), [Subagents: hooks in frontmatter](https://code.claude.com/docs/en/sub-agents), [Claude Code CHANGELOG 2.1.0](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: REPO-005, REPO-007, REPO-033, SKILL-023

Same format as settings, as YAML under `hooks:` (since v2.1.0):
```yaml
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/security-check.sh"
```

| | Agent frontmatter | Skill frontmatter |
|---|---|---|
| Active | Only while that subagent runs | From invocation to the end of the session |
| `Stop` | Converted to `SubagentStop` | Stays `Stop` |
| `once: true` | Ignored | Removes the hook after its first successful run |
| Project copy in an untrusted folder or `-p` | **Skipped** (needs that exact folder trusted, since v2.1.218) | Runs |
| Plugin copy | `hooks` field ignored | Runs |

Uses:
- **Agent:** a guard that applies only to one role, such as the read-only Bash hook for reviewers (REPO-033). Because it is skipped under `-p` and in untrusted clones, pair it with a deny rule.
- **Skill:** a check that should start once a procedure begins, e.g. a deploy skill that adds a PreToolUse guard. Remember it keeps running after the skill's turn; use `once: true` for a one-shot.

## [HOOK-021] `/hooks`, live reload and switching hooks off
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Hooks reference: the /hooks menu, disable or remove hooks](https://code.claude.com/docs/en/hooks#the-%2Fhooks-menu), [Settings: when edits take effect](https://code.claude.com/docs/en/settings), [Settings reference: disableAllHooks, allowManagedHooksOnly](https://code.claude.com/docs/en/settings-reference)
- Related: HOOK-016, HOOK-022, REPO-006

- **`/hooks`** is "a read-only browser". Each hook is labelled with its source (user, project, local, plugin, session); select one to see the full command and file. `All events` lists empty events too. Edit the settings files to change hooks.
- **Live reload.** Claude Code watches settings files and "applies most edits to the running session without a restart, including edits to `permissions`, `hooks`". If `/hooks` doesn't show an edit after a few seconds, restart. Each settings-file change fires `ConfigChange`.
- **Invalid entries.** An unknown event name is skipped with a settings warning. One schema-invalid matcher can drop the whole file's hooks (HOOK-024).
- **`disableAllHooks: true`** turns off user, project, local and plugin hooks, plus custom status line and mods. It follows normal precedence, so a project's `false` beats your user `true`; for one run use `--settings '{"disableAllHooks": true}'`. "There is no way to disable an individual hook while keeping it in the configuration."
- **Managed controls:** `allowManagedHooksOnly`, `strictPluginOnlyCustomization: ["hooks"]`, `allowedHttpHookUrls`, `httpHookAllowedEnvVars`. Only managed `disableAllHooks` stops managed hooks.
- **`--bare`** skips hook discovery; `--safe-mode` disables hooks except managed ones.

## [HOOK-022] Debug log for hooks
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Hooks reference: debug hooks](https://code.claude.com/docs/en/hooks#debug-hooks), [Hooks guide: check what a hook did](https://code.claude.com/docs/en/hooks-guide#check-what-a-hook-did), [CLI reference](https://code.claude.com/docs/en/cli-reference), [Claude Code CHANGELOG 2.1.296](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: HOOK-023, HOOK-024

- **Turn it on:** `claude --debug-file /tmp/claude.log` (known path), or `claude --debug` → `~/.claude/debug/<session-id>.txt` (a `latest` symlink is created). `--debug` prints nothing to the terminal. Mid-session: `/debug`.
- **Find slow hooks (v2.1.296+):** grep `Hooks:` lines, e.g. `Hooks: PostToolUse:Write [.claude/hooks/log-write.sh] finished with status 0 (31ms)`. Endings: `timed out after <N>ms`, `cancelled`, `moved to the background`, `failed to start`.
- **Useful strings:** `Hook output does not start with {` (JSON read as text), `Hook JSON output had unrecognized keys` (field at the wrong level), `Skipping hook due to if condition`, `modified tool input keys` (an `updatedInput` applied).
- **More detail:** `CLAUDE_CODE_DEBUG_LOG_LEVEL=verbose` adds matcher counts and dedup lines.
- **Don't filter.** `--debug=hooks` keeps only `Hooks:`-prefixed lines and drops the diagnostic strings above (tested 2026-10-12, v2.1.296). The space form `--debug hooks` doesn't filter at all.
- **In the session:** `Ctrl+O` transcript view shows block messages and `<hook> hook error` notices; success is silent. Stderr of an exit-0 hook appears only in the debug log.
- **Elsewhere:** `/doctor` reports invalid settings files; `/status` shows active setting sources.

## [HOOK-023] Testing a hook script on its own
- Type: pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Hooks guide: hook error in output](https://code.claude.com/docs/en/hooks-guide#hook-error-in-output), [Hooks reference: hook events](https://code.claude.com/docs/en/hooks#hook-events)
- Related: HOOK-022, HOOK-024

The documented loop: pipe sample input in and check the exit code.
```bash
echo '{"tool_name":"Bash","tool_input":{"command":"ls"}}' | ./my-hook.sh
echo $?  # 0 = no decision, 2 = block
```

Make it a habit:
1. **Save real inputs.** Copy the event's JSON example from the reference, or log one live payload (`cat > /tmp/sample.json`) from a temporary hook.
2. **Cover both sides.** One input that must pass and one that must block, including the awkward forms: `git -C path push`, `a && b`, quoted paths, paths outside the project.
3. **Check stdout is only JSON** when the hook returns JSON: `./hook.sh < in.json | jq -e .`.
4. **Set the environment** the hook expects: `CLAUDE_PROJECT_DIR=… ./hook.sh`.
5. **Then run it for real** with a cheap capped probe in a scratch folder: `claude -p "…" --model haiku --max-turns 2 --max-budget-usd 0.10 --debug-file /tmp/c.log`, and grep the log (HOOK-022). `-p` treats the folder as trusted, so project hooks load.
6. **Watch the first interactive run** for a `hook error` notice: a mistyped path fails silently otherwise (HOOK-013).

For a shared hook, keep the sample inputs next to the script and run them in CI.

## [HOOK-024] Why a hook silently does nothing
- Type: anti-pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Hooks guide: limitations and troubleshooting](https://code.claude.com/docs/en/hooks-guide#limitations-and-troubleshooting), [anthropics/claude-code#75081](https://github.com/anthropics/claude-code/issues/75081), [anthropics/claude-code#21460](https://github.com/anthropics/claude-code/issues/21460)
- Related: HOOK-004, HOOK-013, HOOK-018, HOOK-022

Checklist, most common first:
1. **Exit 1 instead of 2.** Non-blocking. A reported "PreToolUse doesn't apply to subagents" bug (#21460) used exit 1; a maintainer showed exit 2 blocks subagent calls the same way.
2. **Text before the JSON.** A shell profile `echo` makes stdout plain text; the JSON is ignored with no error. Guard profile output with `if [[ $- == *i* ]]`. Debug string: `Hook output does not start with {`.
3. **Field at the wrong level.** `permissionDecision` or `additionalContext` outside `hookSpecificOutput` is ignored silently.
4. **Matcher case or shape.** `bash`, `mcp__server` without `__.*`, a matcher on an event that has none.
5. **`if` on a non-tool event**: the hook never runs.
6. **Script not found or not executable** (`chmod +x`): a `hook error` notice and nothing else.
7. **One invalid matcher drops the whole file.** A maintainer reproduced on v2.1.233 that one schema-invalid matcher (an object instead of a string) discards every hook in that settings file; interactive mode warns; `-p` was silent until v2.1.299, which lists the file and the invalid entry on stderr in text-output runs (the whole-file drop is unchanged; closed as duplicate of #75071).
8. **Started in a subdirectory**: project hooks don't load (HOOK-016).
9. **Folder not trusted** (interactive) or agent frontmatter under `-p` (HOOK-020).
10. **Timed out**: no decision (HOOK-012).

After editing hooks: open `/hooks`, then run one capped `-p` probe with `--debug-file` (HOOK-023).

## [HOOK-025] Hooks run with your permissions; trust and `-p`
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Hooks reference: security considerations](https://code.claude.com/docs/en/hooks#security-considerations), [Permissions: what runs before you trust a folder](https://code.claude.com/docs/en/permissions#what-runs-before-you-trust-a-folder), [Sandboxing: what runs outside the sandbox](https://code.claude.com/docs/en/sandboxing)
- Related: REPO-007, HOOK-026, HOOK-017

"Command hooks execute shell commands with your full user permissions. They can modify, delete, or access any files your user account can access."

- **Not sandboxed.** Command hooks, MCP servers and helpers "run with your full access" outside the Bash sandbox. The sandbox does stop sandboxed Bash from writing `.claude` settings or `.claude/hooks`, so a sandboxed command can't plant a hook.
- **Interactive trust.** Claude Code "holds back hooks from every settings file, including your own `~/.claude/settings.json`, until you accept the workspace trust dialog" for the folder or a parent whose trust extends to it.
- **`-p` and SDK trust everything.** They "treat the folder as trusted, so hooks committed in a repository's `.claude/settings.json` run in a folder you've never trusted". Before scripting `claude -p` over a repo you didn't write: read its `.claude/` settings, use `--bare`, or pass `--settings '{"disableAllHooks": true}'` (your user setting alone isn't enough, the project can set it back).
- **Agent frontmatter is stricter**: skipped until that exact folder is trusted, and under `-p` (REPO-007).
- **Plugins:** `/plugin` "shows that a hook exists but not what it runs". Read `hooks/hooks.json` before enabling.
- **Credentials:** hooks inherit your environment, including tokens. `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1` strips Anthropic and cloud credentials from hooks and Bash.

## [HOOK-026] Hooks read untrusted input and are not a security boundary
- Type: recommendation
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Hooks reference: security best practices, bash if matching](https://code.claude.com/docs/en/hooks#security-best-practices), [Permissions: what a Bash rule doesn't match](https://code.claude.com/docs/en/permissions), [kenryu42/cc-safety-net security model](https://ccsafetynet.com/docs/guides/security-model.md)
- Related: HOOK-025, HOOK-019, HOOK-028, REPO-035

`tool_input` is text the model wrote, and the model's choices can be steered by file contents, web pages and MCP output. Treat every field as hostile input to a program running with your permissions.

The docs' practices: validate and sanitize input; quote every variable (`"$VAR"`); reject `..` in paths; use absolute script paths (`${CLAUDE_PROJECT_DIR}`; exec form with `args` avoids shell quoting entirely); skip `.env`, `.git/` and keys.

Don't:
- `eval`, `sh -c "$cmd"` or unquoted expansion of a field.
- Echo secrets or file contents into `additionalContext`, `systemMessage` or stderr: they land in the transcript and the debug log.
- Treat a regex over a Bash command as a wall. `bash -c '…'`, `/usr/bin/rm`, `git -C . push`, `python -c` and aliases all slip past text matching; the docs call `if` "best-effort". A file-tool matcher on `Edit|Write` never sees `sed -i`.

Do:
- Put hard limits in `permissions.deny` and the sandbox; use hooks for custom policy and feedback on top.
- Even community guards say this: cc-safety-net calls itself "a best-effort, static pre-execution policy gate… not an operating-system sandbox".

## [HOOK-027] Pattern: format or lint after an edit
- Type: pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Hooks guide: auto-format code after edits](https://code.claude.com/docs/en/hooks-guide#auto-format-code-after-edits), [Hooks reference: run tests after file changes](https://code.claude.com/docs/en/hooks#run-tests-after-file-changes)
- Related: HOOK-011, HOOK-036, REPO-044

Official example:
```json
{"hooks":{"PostToolUse":[{"matcher":"Edit|Write","hooks":[{"type":"command","command":"jq -r '.tool_input.file_path' | xargs npx prettier --write"}]}]}}
```

Make it robust:
- **Stay inside the project.** Only format paths under the checkout (our repos do this, HOOK-036).
- **Use the local binary**, not `npx` (which may download): `"$CLAUDE_PROJECT_DIR"/node_modules/.bin/prettier --write --ignore-unknown "$f"`.
- **Be silent and exit 0.** Formatting isn't a decision; output on PostToolUse goes to the debug log anyway.
- **Tight timeout** (`"timeout": 30`).
- **Bash edits aren't covered.** If commands also rewrite files, the guide suggests `FileChanged` instead.

**Lint that Claude should act on:** exit 2 with the errors on stderr (Claude sees them; the edit already happened), or return `additionalContext`. Keep the output short: only errors, under the 10,000-character cap.

**Slow checks** (type check, tests): run them `async: true` so the turn isn't stalled, and report via `additionalContext` on the next turn (HOOK-011). Or gate once before push or at Stop rather than after every edit.

## [HOOK-028] Pattern: block dangerous commands and protected files
- Type: pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Hooks guide: block edits to protected files](https://code.claude.com/docs/en/hooks-guide#block-edits-to-protected-files), [Hooks reference: how a hook resolves](https://code.claude.com/docs/en/hooks#how-a-hook-resolves), [examples/hooks/bash_command_validator_example.py](https://github.com/anthropics/claude-code/blob/main/examples/hooks/bash_command_validator_example.py)
- Related: HOOK-026, HOOK-019, HOOK-032, REPO-033

**Protected files** (PreToolUse, matcher `Edit|Write`): read `.tool_input.file_path`; if it matches `.env`, `package-lock.json` or `.git/`, print a reason to stderr and `exit 2`.

**Dangerous commands** (PreToolUse, matcher `Bash`, `if: "Bash(rm *)"`): return
```json
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Destructive command blocked by hook"}}
```

Make it work:
- **Give Claude a way forward** in the reason ("use `rg`", "ask the user"). The official validator steers style this way rather than only refusing.
- **Parse, don't prefix-match.** `[[ $cmd == rm* ]]` misses `cd x && rm`; handle `&&`, `;`, `$()`, `git -C`, `bash -c` (HOOK-019). Parser-based tools exist (HOOK-032).
- **Deny rules first.** For a fixed list (`Bash(git push --force *)`, `Read(./.env)`), `permissions.deny` is simpler and can't fail open. Use a hook for logic a rule can't express.
- **Fail closed only where it matters** (`onFailure: "block"`, HOOK-013).
- **Allow-and-block recipe:** add `"Bash"` to the allow list and let the hook block the few bad commands; an exit-2 block beats allow rules.

Not a boundary (HOOK-026): pair with the sandbox for unattended runs.

## [HOOK-029] Pattern: context at SessionStart, after compaction, before compaction
- Type: pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Hooks guide: re-inject context after compaction](https://code.claude.com/docs/en/hooks-guide#re-inject-context-after-compaction), [Hooks reference: SessionStart, PreCompact, PostCompact](https://code.claude.com/docs/en/hooks#precompact), [How to configure hooks (Anthropic, 2025-12-11)](https://claude.com/resources/articles/how-to-configure-hooks)
- Related: HOOK-007, HOOK-008, TOK-031, ORCH-019

**At start:** a SessionStart hook prints dynamic state (branch, uncommitted files, the active issue) as plain stdout or `additionalContext`, and can set `sessionTitle`. Keep it fast: the first answer waits for it (HOOK-008).

**After compaction:** SessionStart with matcher `compact` re-adds what the summary may lose:
```json
{"hooks":{"SessionStart":[{"matcher":"compact","hooks":[{"type":"command","command":"echo 'Reminder: use Bun, not npm. Run bun test before committing.'"}]}]}}
```
`PostCompact` gets `compact_summary` but can't add context; use it for logging.

**Before compaction:** `PreCompact` (matcher `manual`/`auto`; `auto` also covers idle compaction, v2.1.290+) gets `transcript_path`, `trigger` and `custom_instructions`. Uses from Anthropic's hooks article: back up the transcript, save decisions to a progress file. It can block compaction (exit 2), but blocking an auto-compact that hit the context limit makes the request fail.

Rules:
- Static rules belong in CLAUDE.md, not a hook (HOOK-007).
- State facts; stay well under 10,000 characters.
- Don't `cat` large files into context: point to the file instead.
- `mcp_tool` hooks don't run at launch.

## [HOOK-030] Pattern: notifications
- Type: pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Hooks guide: get notified when Claude needs input](https://code.claude.com/docs/en/hooks-guide#get-notified-when-claude-needs-input), [Hooks reference: emit terminal notifications, Notification](https://code.claude.com/docs/en/hooks#emit-terminal-notifications)
- Related: HOOK-031, HOOK-017

**Event:** `Notification`, matcher `permission_prompt`, `idle_prompt` (after about 60 s idle), `agent_needs_input`, `agent_completed`, or empty for all. Exit code and stderr are ignored, and `systemMessage` is discarded.

**OS notification** (Linux): `notify-send 'Claude Code' 'Claude Code needs your attention'`; macOS: `osascript -e 'display notification …'`.

**Terminal notification without `/dev/tty`** (v2.1.141+): return a `terminalSequence` and Claude Code writes it itself, which works in tmux and Windows Terminal:
```bash
body=$(jq -r '.message // "Needs your attention"')
seq=$(printf '\033]777;notify;%s;%s\007' "Claude Code" "$body")
jq -nc --arg seq "$seq" '{terminalSequence: $seq}'
```
Allowed: OSC 0/1/2 (titles), 9, 99, 777 and BEL; anything else voids the field. Interactive sessions only; ignored in `-p` and the SDK.

**On Stop:** read `last_assistant_message` from the input rather than the transcript, which may lag. Stop fires every turn, so a Stop notifier is noisier than `idle_prompt`.

**Immediate permission alerts:** `PermissionRequest` fires when the prompt appears; `Notification`/`permission_prompt` fires about 6 s later: in the terminal only if you haven't typed (each keystroke defers it), in the desktop app and VS Code regardless of typing (v2.1.233+; `CLAUDE_CODE_DISABLE_PERMISSION_PROMPT_NOTIFY_HOOKS=1` turns it off there).

## [HOOK-031] Pattern: Stop hooks that keep Claude working
- Type: pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Hooks reference: Stop](https://code.claude.com/docs/en/hooks#stop), [Hooks guide: Stop hook hits the block cap](https://code.claude.com/docs/en/hooks-guide#stop-hook-hits-the-block-cap), [ralph-loop plugin](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/ralph-loop), [Claude Code CHANGELOG 2.1.143](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: REPO-025, ORCH-019, HOOK-010

A Stop hook continues the turn with exit 2 (stderr = instruction), `{"decision":"block","reason":"…"}`, or `hookSpecificOutput.additionalContext` (labelled "Stop hook feedback", no error notice).

Loop protection:
- **Cap:** "after stop hooks have continued the turn eight times in a row, Claude Code overrides the next block and ends the turn". The count resets when Claude calls a tool. Raise with `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` (default 8, `0` disables; v2.1.143+). Tested 2026-10-12, v2.1.296, `-p`, Haiku, no tools: an always-block hook ran 9 times, then the turn ended.
- **`stop_hook_active`** is true when Claude is already continuing because of a Stop hook. Exiting early on it allows one continuation; for "until tests pass", run the real check and rely on the cap or your own counter keyed on `session_id`.
- Use `impossible: true` in prompt hooks for conditions that can't be met.

Options, simplest first:
1. `/goal <condition>`: built-in session-scoped prompt Stop hook.
2. A command Stop hook running a cheap check (`npm test` → exit 2 with the last 40 lines on stderr).
3. `ralph-loop` (official plugin): a state file with `max_iterations` and a completion promise; scoped to its `session_id`.
4. `prompt`/`agent` Stop hooks (HOOK-010).

Stop fires on **every** turn end, not only at task completion, and not on interrupts (API errors fire `StopFailure`). Keep the check fast and conditional, e.g. only when files changed.

## [HOOK-032] Community hook collections worth reading
- Type: tool
- Applies to: Claude Code
- Confidence: community-consensus
- Last verified: 2026-10-14
- Sources: [kenryu42/cc-safety-net](https://github.com/kenryu42/cc-safety-net), [nizos/tdd-guard](https://github.com/nizos/tdd-guard), [karanb192/claude-code-hooks](https://github.com/karanb192/claude-code-hooks), [ldayton/Dippy](https://github.com/ldayton/Dippy), [disler/claude-code-hooks-mastery](https://github.com/disler/claude-code-hooks-mastery), [hookify](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/hookify), [security-guidance](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/security-guidance)
- Related: HOOK-028, HOOK-033, HOOK-026

Stars read 2026-10-12. Read the code; don't install unvetted hooks, they run with your permissions.

| Repo | Stars, last push | What it is | Verdict |
|---|---|---|---|
| kenryu42/cc-safety-net | 1,603, 2026-10-12 | Guard for destructive git/fs commands (also inside `bash -c`) and secret reads; presets | Best safety net found; CI; candid "not adversarial-grade" docs; use strict mode unattended |
| nizos/tdd-guard | 2,361, 2026-10-12 | Blocks edits that skip a failing test, via an LLM validator | Well maintained; LLM on every edit; succeeded by nizos/probity |
| karanb192/claude-code-hooks | 542, 2026-10-04 | 22 small hooks as a plugin marketplace (git-safety, protect-secrets, notify…) | Good structure, per-hook tests; check each regex |
| ldayton/Dippy | 243, 2026-06-12 | Auto-approves safe Bash with a real bash parser | Answer to permission fatigue; not pushed since June |
| disler/claude-code-hooks-mastery | 3,939, 2026-03-04 | One script per event, payload logging, PreCompact backup | Best payload reference; not production code (broad regexes, no license) |
| hookify (official plugin) | — | `/hookify` writes regex warn/block rules | Small and readable; regex limits apply |
| security-guidance (official plugin) | — | Regex on edits, LLM review on Stop with `asyncRewake`, `if` per git form | Model of where to put expensive checks |

Stale, skip: johnlindquist/claude-hooks (last push 2025-08-08), decider/claude-hooks (2025-07-20).

## [HOOK-033] Hook anti-patterns
- Type: anti-pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Hooks guide: limitations](https://code.claude.com/docs/en/hooks-guide#limitations), [Hooks reference](https://code.claude.com/docs/en/hooks), [anthropics/claude-code#85250](https://github.com/anthropics/claude-code/issues/85250)
- Related: HOOK-024, HOOK-015, HOOK-026, SKILL-029

- **A hook for a static rule.** Unchanging instructions go in CLAUDE.md; a hook is for must-happen checks and dynamic context (TOK-065).
- **Exit 1 as a block** (HOOK-024).
- **Expecting PostToolUse to undo.** "`PostToolUse` hooks can't undo actions"; `updatedToolOutput` only changes what Claude sees. Prevent in PreToolUse.
- **Slow work on hot paths.** Tests or type checks on every edit, or a `prompt`/`agent` hook on PreToolUse, stall every call. Use `if`, `async`, or move the check to push or Stop.
- **Chatty context.** Plain stdout on UserPromptSubmit or SessionStart, big `cat`s, debug echoes: each is re-read every later turn, and over 10,000 characters it's spilled to a file Claude isn't told to read.
- **Stop hooks without an exit condition.** They burn up to eight extra turns per stop. In a 2026-10-12 probe, Claude edited the unsatisfiable hook script in its working directory to let itself stop: keep hook scripts out of paths Claude edits freely, or deny edits to `.claude/hooks/**`.
- **Two hooks rewriting the same input** (non-deterministic winner).
- **Wide `PermissionRequest` allow.** An empty or `.*` matcher "would auto-approve every tool permission prompt".
- **Background children with open stdio**: print the decision before starting one and redirect its output (`>/dev/null 2>&1 &`); an unredirected child after an allow is blocked, and a decision it prints late doesn't count (HOOK-012).
- **Relying on a hook that fails open** as the only guard (HOOK-013).
- **Secrets in hook output** (HOOK-026).
- **Regex as a security boundary** (HOOK-026).
- **Unpinned commands in CI hooks** (`npx`, `npm run` on PR code; HOOK-017).

## [HOOK-034] Hooks in other coding agents
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Cursor hooks](https://cursor.com/docs/hooks), [Codex hooks](https://developers.openai.com/codex/hooks), [Codex advanced config](https://developers.openai.com/codex/config-advanced), [Gemini CLI hooks](https://geminicli.com/docs/hooks/), [GitHub Copilot hooks reference](https://docs.github.com/en/copilot/reference/hooks-reference)
- Related: HOOK-013, HOOK-031, TOK-085

| Tool | Hooks | Idea worth noting |
|---|---|---|
| Cursor | `hooks.json`; preToolUse, beforeShellExecution, afterFileEdit, stop, preCompact… Exit 2 denies "for compatibility" with Claude Code, and it loads Claude Code hooks | Per-hook `failClosed`; `loop_limit` on stop hooks (default 5) |
| Codex CLI | `hooks.json` or `[hooks]` in `config.toml`; PreToolUse, PermissionRequest, Stop, SubagentStart… plus a simpler `notify` program | Non-managed hooks need trust, recorded against the hook's **hash**: a changed hook is skipped until re-trusted |
| Gemini CLI | BeforeTool, AfterTool, BeforeModel, PreCompress… | Project hooks fingerprinted; a changed command is treated as new and untrusted |
| GitHub Copilot | `.github/hooks/*.json`; accepts Claude-style event names | Documented fail modes per hook kind; a malformed item is dropped alone, valid siblings still load |

Claude Code already has the fail-closed flag (`onFailure`, HOOK-013) and a stop-loop cap (HOOK-031). The ideas it lacks: **hash-pinned trust** of repo hooks (today a `git pull` can change what a trusted repo's hooks run without a prompt) and **dropping only the invalid hook** rather than the whole file (HOOK-024).

Confidence note: read from each vendor's docs on 2026-10-12; defaults there may drift.

## [HOOK-035] Plugin mods versus settings hooks
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Hooks reference (intro)](https://code.claude.com/docs/en/hooks), [Permissions: extend permissions with hooks](https://code.claude.com/docs/en/permissions#extend-permissions-with-hooks), [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview)
- Related: HOOK-006, HOOK-016

A plugin can also register hooks as **JavaScript functions** that Claude Code calls in its own process; such a plugin is a **mod**. Mods can draw in the interface (panes, status bands) as well as act on events (`tool.check`, `prompt.submit`, `agent.spawn`, …). The settings hooks in this file "keep working alongside mods".

What matters for hook authors:
- A mod's `tool.check` answers **after** permission rules and PreToolUse hooks, and "can approve a call that your `PreToolUse` hook blocked, unless the hook is in managed settings".
- `disableAllHooks` also disables mods.
- Most hook-related CHANGELOG lines from 2.1.288 to 2.1.296 are about mods, not settings hooks; check which kind an entry means.

Use a settings hook for a shell check on an event; use a mod for in-process logic or UI. Writing mods is out of scope here.

Confidence note: from the hooks and permissions pages; the mods docs themselves were only skimmed.

## [HOOK-036] Our hooks today (osrs-tracker repos, user settings)
- Type: fact
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-14
- Sources: local files read 2026-10-12: `~/.claude/settings.json`, `osrs-tracker-{web,api,aws}/.claude/settings.json`, `.claude/hooks/pre-push-check.sh`; [osrs-tracker/osrs-tracker-aws#79](https://github.com/osrs-tracker/osrs-tracker-aws/pull/79), [osrs-tracker/osrs-tracker-web#235](https://github.com/osrs-tracker/osrs-tracker-web/pull/235), [osrs-tracker/osrs-tracker-api#139](https://github.com/osrs-tracker/osrs-tracker-api/pull/139); [Permissions: Bash rule limits](https://code.claude.com/docs/en/permissions)
- Related: REPO-001, REPO-033, REPO-043, HOOK-019, HOOK-015

**User level** (2026-10-14): one hook in `~/.claude/settings.json`, none in `settings.local.json`: `SessionStart` (matcher `startup`, timeout 20 s) runs `~/.claude/hooks/ff-worktree.sh`, which fast-forwards a clean new worktree to origin's default branch and never blocks (SESS-036). None of the enabled plugins ship `hooks.json`. Default mode is `auto`, with deny rules for destructive cluster commands and the credential files (INFRA-024).

**osrs-tracker-web and -api** (identical except `lint` vs `lint:ci`):
- PostToolUse `Edit|Write`: inline Prettier on the edited file, only under `$CLAUDE_PROJECT_DIR`, silent, `exit 0`, timeout 30 s. Matches HOOK-027.
- PreToolUse `Bash` with `"if": "Bash(git *)"` (since 2026-10-12, osrs-tracker/osrs-tracker-web#235 and osrs-tracker/osrs-tracker-api#139): `pre-push-check.sh` on every git subcommand, including `cd x && git push`, since `if` checks each subcommand (HOOK-019). It parses `git [-C path|-c k=v|--flag]… push`, resolves the pushed checkout from `cwd` or `-C` (not `$CLAUDE_PROJECT_DIR`, which stays at the main checkout), runs lint and `prettier:ci`, and blocks with exit 2 and the last 40 lines. Fails open when it can't tell. Timeout 300 s, `statusMessage` set. Costs about 4 ms per non-push call (HOOK-015).
- Agent frontmatter: the reviewers' read-only Bash hook (REPO-033).

**osrs-tracker-aws:**
- Same Prettier hook.
- PreToolUse `Bash` with `"if": "Bash(git *)"` (since 2026-10-12, osrs-tracker/osrs-tracker-aws#81): `pre-push-check.sh` with web's push parsing and `-C` resolution, running `prettier:ci` and then `lint` in each `lambda/*/`. Same exit-2 block and fail-open behaviour as web.
- Until 2026-10-12 it used `"if": "Bash(git push*)"` and an inline script that linted the hook's working directory, so `git -C <path> push` and `git -c … push` skipped the gate (HOOK-019). Fixed in osrs-tracker/osrs-tracker-aws#79 (issue #78).

All three gates are backed by CI lint, so a miss costs a red CI run, not a bad merge.

---

## Recommendations for our setup

Ranked by impact against effort.

1. **Done 2026-10-12: fix the aws push gate's `git -C` gap** (osrs-tracker/osrs-tracker-aws#79). HOOK-036.
2. **Done 2026-10-12: `"if": "Bash(git *)"` on the push gate in all three repos**, so non-git Bash calls skip the spawn (osrs-tracker/osrs-tracker-web#235, osrs-tracker/osrs-tracker-api#139, osrs-tracker/osrs-tracker-aws#81). HOOK-015, HOOK-019.
3. **Keep the push gates fail-open; don't add `onFailure: "block"`** (decision). A broken script would then block every Bash call, and CI lints anyway. HOOK-013.
4. **No `prompt` or `agent` hooks on tool events** (decision). Use `/goal` for ad-hoc "keep going until X", and the reviewer agents for judgement. HOOK-010, HOOK-031, REPO-025.
5. **When scripting `claude -p` over a repo we didn't write, pass `--settings '{"disableAllHooks": true}'` or `--bare`** (high impact if it ever happens, trivial effort). Our repos' hooks are ours, so this only matters for third-party clones. HOOK-025.
6. **Optional: a user-level `Notification` hook with `terminalSequence`** for terminal sessions on WSL (low impact, low effort). Skip if the desktop app and push notifications already cover it. HOOK-030.
7. **Test hook edits the HOOK-023 way** (sample JSON piped in, then one capped `-p` probe with `--debug-file`), because one invalid matcher drops a file's hooks, silently under `-p` before v2.1.299. HOOK-024.

## Open questions

- **Where an `agent` hook's tokens are billed:** they didn't appear in `-p` JSON `total_cost_usd` or `modelUsage` (HOOK-010); `/usage` in an interactive session wasn't checked. REPO's open question on prompt and agent hook cost is answered for `prompt` hooks only.
- **What a `prompt` or `agent` hook does on a model error or timeout:** not documented, not tested.
- **Async hooks and `timeout`:** the docs say it isn't enforced, but the debug log registers async hooks "with timeout 600000ms". Not tested past 600 s.
- **`/hooks` in the desktop Code tab:** undocumented; not tested.
- **Does `if` strip the same wrappers as permission rules** (`timeout`, `nice`, `command`)? Inferred, not tested.
- **Does an agent's frontmatter `Stop` hook convert to `SubagentStop` when the agent runs as the main session (`--agent`)?** Not stated.
- **Is `Hook JSON output had unrecognized keys` logged at the default debug level** or only with `CLAUDE_CODE_DEBUG_LOG_LEVEL=verbose`? Seen only in a verbose run, but the hooks guide says to "start Claude Code with `claude --debug` and search the debug log" for it, which implies the default level. Not retested.
- **Claude Code's own spawn overhead per hook** (Node child-process start) beyond the script time we measured: the debug log's 5–7 ms durations suggest small, but we didn't isolate it.
- **Version that added `UserPromptExpansion`, `PostToolBatch`, `PostToolUseFailure`**: not found in the CHANGELOG.
