# MCP servers: configuration, access control, surfaces and vetting

Prefix: MCP. Researched 2026-10-13 on Claude Code v2.1.296 (WSL terminal) and the desktop app's CLI build 2.1.295, against the docs live that day; re-verified 2026-10-14 against the docs fetched that day, the claude-code CHANGELOG through 2.1.299 and our repos' `origin/main` (each entry's Last verified date is authoritative). This file covers how MCP servers are configured, approved, authenticated, permissioned and scoped in Claude Code, how they behave on each surface, and how to choose, vet and write one. MCP topics covered elsewhere are linked, not repeated: context cost and tool search (TOK-020 to TOK-022), output limits (TOK-023), code execution with MCP on the API (TOK-024), our AWS, Kubernetes and Flux servers and why a read-only flag isn't a boundary (INFRA-003 to INFRA-007), docs servers (TOK-095 to TOK-097), GA4 (WEB-006), Playwright and browser checks (FLOW-014, REPO-021), processes across parallel sessions (SESS-013), and MCP versus skills and hooks (SKILL-021). Docs pages were read in full as `.md` (`curl -sL https://code.claude.com/docs/en/mcp.md`); version numbers come from the claude-code CHANGELOG.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Local, project or user scope? | User for personal tools in every repo, project (`.mcp.json`, committed) for what a repo needs, local for credentials or experiments in one repo. Local and user both live in `~/.claude.json`. On a name clash local wins, then project, then user, then plugins, then connectors; entries aren't merged. | MCP-001 |
| Does a repo's `.mcp.json` run without asking? | Interactive: asks per server, and the repo can't approve itself. `claude -p`, the SDK and cloud sessions load it without asking. Block with `disabledMcpjsonServers`, `--strict-mcp-config`, `--setting-sources user` or `--bare`. | MCP-002 |
| How do I turn a server off? | `/mcp` toggle (per project), `disabledMcpjsonServers` (a `.mcp.json` server), `deniedMcpServers` (any server, any settings file, always wins), `disableClaudeAiConnectors` (all fetched connectors). | MCP-003 |
| How do I allow or deny one MCP tool? | `mcp__server__tool`, `mcp__server__*`; allow globs need a literal `mcp__server__` prefix; `"mcp__*"` works only in deny. Parameter rules like `mcp__x__y(arg:v)` are skipped in settings files. Plugin tools are `mcp__plugin_<plugin>_<server>__<tool>`. | MCP-004, MCP-009 |
| How do I keep an API key out of `.mcp.json`? | `${VAR}` or `${VAR:-default}` in `command`, `args`, `env`, `url`, `headers`. Claude Code and cloud credentials (`ANTHROPIC_API_KEY`, `NPM_TOKEN` …) read as empty in a remote server's URL and headers. | MCP-005 |
| How do I sign in to a remote server from WSL or SSH, or for `-p`? | `claude mcp login <name>` (prints the URL when there's no browser; `--no-browser`). `-p` can't sign in: do it once interactively. Pin scopes with `oauth.scopes`. | MCP-006 |
| Server uses SSO or short-lived tokens, not OAuth? | `headersHelper`: a command printing JSON headers, run on each connect, 10 s limit, rerun on 401/403. Repo-supplied helpers run only in a trusted folder and without `*TOKEN*`/`*KEY*` variables. | MCP-007 |
| How do I give a server to one subagent only? | Inline `mcpServers` in the agent file: it connects for that agent's run and its tools never reach the main context. Project agent files need the folder trusted; plugin agents ignore the field. | MCP-008 |
| Why does my claude.ai connector show up in Claude Code, and how do I stop it? | Connectors come with a claude.ai login. Stop them with `disableClaudeAiConnectors`, `deniedMcpServers` `{ "serverName": "claude.ai X" }` or `/mcp`. Desktop-delivered connectors ignore all MCP settings: disconnect them at claude.ai. | MCP-010 |
| What do MCP servers cost a `claude -p` run, and how do I skip them? | Ours on 2026-10-13: 8 servers, about 6,600 input tokens per request and about 2 s per run, even deferred. `--strict-mcp-config` (optionally with `--mcp-config`) loads none; `--bare` does too but needs API-key auth. | MCP-012, MCP-028 |
| How long can an MCP tool call run? | Wall clock about 28 h by default; idle limit 5 min (remote) or 30 min (stdio); main-thread calls move to the background after 2 min. Stdio servers aren't reconnected automatically. | MCP-011 |
| Should I build an MCP server, use a CLI or write a skill? | A CLI Claude knows first (most context-efficient), MCP for systems with no CLI or with OAuth, a skill for the procedure on top. When building: few workflow-shaped tools, not an API mirror. | MCP-017, MCP-018 |
| Is a third-party MCP server safe to add? | Treat a stdio server as untrusted code with your privileges: check the publisher, pin the version, read its tools, give it its own narrow token. Claude Code accepts changed tool lists without re-approval. | MCP-019 |
| Which MCP servers reach cloud sessions, routines and the GitHub Action? | Cloud: the repo's `.mcp.json` and claude.ai connectors, not `~/.claude.json` or repo plugins. Routines: all connectors by default, writes without prompts. Action: `--mcp-config` in `claude_args` plus built-in GitHub servers; tools must be in `--allowedTools`. | MCP-022, MCP-021 |
| Can the Claude API call an MCP server directly? | Yes, the MCP connector (`mcp_servers`, beta `mcp-client-2025-11-20`): remote HTTP servers only, tool calls only, no Bedrock or Vertex. | MCP-025 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| MCP-001 | Installation scopes and which definition wins | fact | scopes, mcp-json, precedence |
| MCP-002 | Project `.mcp.json`: approval, workspace trust and headless runs | fact | mcp-json, trust, headless, approval |
| MCP-003 | Turning a server off: four different switches | fact | disable, deny, connectors |
| MCP-004 | Permission rules for MCP tools | fact | permissions, rules, tool-names |
| MCP-005 | Secrets in MCP config: `${VAR}` expansion and what reads as empty | fact | secrets, env, mcp-json |
| MCP-006 | Signing in to remote servers: OAuth from `/mcp` or the shell | fact | oauth, auth, remote |
| MCP-007 | `headersHelper`: short-lived tokens without OAuth | pattern | auth, headers-helper, trust |
| MCP-008 | Scope a server to one subagent with inline `mcpServers` | pattern | subagents, scoping, context |
| MCP-009 | Plugin-bundled MCP servers | fact | plugins, tool-names |
| MCP-010 | claude.ai connectors in Claude Code | fact | connectors, claude-ai, desktop |
| MCP-011 | Timeouts, reconnection and backgrounded tool calls | fact | timeouts, reconnect, background |
| MCP-012 | MCP startup and context cost in scripted runs | recommendation | headless, startup, tokens, strict-mcp-config |
| MCP-013 | Resources, prompts and elicitation | fact | resources, prompts, elicitation |
| MCP-014 | Client runtimes, protocol 2026-07-28 and supported features | fact | protocol, spec, list-changed |
| MCP-015 | Server-side knobs Claude Code reads | fact | server-authors, meta, schemas |
| MCP-016 | Managed MCP patterns and what a solo user can use | fact | managed, allowlist, denylist |
| MCP-017 | CLI, skill or MCP server? | comparison | architecture, cli, build-vs-adopt |
| MCP-018 | Designing a server: rules from `mcp-builder` | recommendation | server-authors, mcp-builder, tool-design |
| MCP-019 | Vetting a third-party server | recommendation | security, supply-chain, rug-pull |
| MCP-020 | Finding servers: Anthropic Directory and the MCP Registry | fact | discovery, registry, directory |
| MCP-021 | MCP in `claude-code-action` | fact | github-actions, ci, allowed-tools |
| MCP-022 | MCP in cloud sessions and routines | fact | cloud, routines, connectors |
| MCP-023 | Desktop app: which MCP config reaches a Code tab session | fact | desktop, wsl, claude-desktop-config |
| MCP-024 | Agent SDK: MCP servers, in-process tools and defaults | fact | agent-sdk, in-process, setting-sources |
| MCP-025 | Claude API MCP connector (`mcp_servers`) | fact | api, mcp-connector, beta |
| MCP-026 | `claude mcp serve`: Claude Code as an MCP server | tool | mcp-serve, desktop |
| MCP-027 | Channels: servers that push events into a session | fact | channels, push, research-preview |
| MCP-028 | Our MCP setup as of 2026-10-13 | fact | our-setup, connectors, inventory |

## [MCP-001] Installation scopes and which definition wins
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [MCP: installation scopes](https://code.claude.com/docs/en/mcp#mcp-installation-scopes)
- Related: MCP-002, MCP-005, SESS-010, SKILL-053

Three scopes: **local** (the default for `claude mcp add`), **project** and **user**. Pick user scope for personal tools you want everywhere, project scope for a server the whole repo needs, local scope for credentials or experiments in one repo.

| Scope | Loads in | Shared | Stored in |
|---|---|---|---|
| Local | Current project | No | `~/.claude.json`, under the project's path |
| Project | Current project | Yes, via git | `.mcp.json` in the project root |
| User | All projects | No | `~/.claude.json`, top level |

"Local scope" for MCP is not `.claude/settings.local.json`: both local and user servers live in `~/.claude.json`, which every session rewrites (SESS-010).

**Precedence** when one server is defined twice: local, then project, then user, then plugin servers, then claude.ai connectors. "The entire server entry from that source is used; fields are not merged across scopes." Scopes match duplicates by name; plugins and connectors match by endpoint (URL or command), so a plugin pointing at the same URL as your user server is dropped. A `managedMcpServers` entry outranks all of them (v2.1.259+).

Same name in two scopes with different endpoints gives a warning in `claude mcp list` and `/mcp`; OAuth sign-ins are stored per endpoint, so each definition needs its own sign-in.

Desktop worktree sessions read `.mcp.json` from the main checkout's root (SKILL-053).

## [MCP-002] Project `.mcp.json`: approval, workspace trust and headless runs
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [MCP: project scope](https://code.claude.com/docs/en/mcp#project-scope), [MCP: project server approvals and workspace trust](https://code.claude.com/docs/en/mcp#project-server-approvals-and-workspace-trust), [Permissions: what runs before you trust a folder](https://code.claude.com/docs/en/permissions#what-runs-before-you-trust-a-folder)
- Related: MCP-001, MCP-003, REPO-007, MEM-028

Interactive sessions ask before connecting each `.mcp.json` server. `claude -p`, the Agent SDK and cloud sessions can't ask, so "it loads project-scoped servers without asking" (the SDK only when `settingSources` includes project settings). So does `bypassPermissions` with `skipDangerousModePermissionPrompt`.

**A repo can't approve itself.** `enableAllProjectMcpServers` or `enabledMcpjsonServers` committed to the project's `.claude/settings.json` "is ignored in an untrusted folder". Approvals still count from user settings, managed settings, `--settings`, and an untracked `.claude/settings.local.json` once the folder is trusted (before v2.1.207 even untrusted). A parent folder's trust doesn't count.

**Keep a server out** of a headless run in a repo you didn't write:
- `disabledMcpjsonServers: ["name"]` in any settings file: blocks it in every mode.
- `--setting-sources user` (SDK: `settingSources` without project): reads neither project settings nor `.mcp.json`.
- `--strict-mcp-config` with `--mcp-config`: only the servers you pass. Since v2.1.246 it no longer waits on approval for the skipped project servers.
- `--bare`: no `.mcp.json`, plugins, skills or hooks.

`claude mcp reset-project-choices` clears your approvals. `claude mcp list` shows `⏸ Pending approval` for unapproved servers, without connecting.

## [MCP-003] Turning a server off: four different switches
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [MCP: disable a server without removing it](https://code.claude.com/docs/en/mcp#disable-a-server-without-removing-it), [Managed MCP: policy-based control](https://code.claude.com/docs/en/managed-mcp#policy-based-control-with-allowlists-and-denylists), [Settings reference](https://code.claude.com/docs/en/settings-reference)
- Related: MCP-002, MCP-010, MCP-016, MCP-028

| Switch | Where | Scope of effect |
|---|---|---|
| `/mcp` toggle | Writes `disabledMcpServers` per project in `~/.claude.json` | One project; config kept. Default-off built-ins (`computer-use`) use `enabledMcpServers` instead |
| `disabledMcpjsonServers` | Any settings file | Rejects named `.mcp.json` servers in every mode |
| `deniedMcpServers` | Any settings file, including user `~/.claude/settings.json` | Blocks any server by `serverUrl`, `serverCommand` or `serverName`; merges from every scope and "Nothing overrides a denylist match" |
| `disableClaudeAiConnectors: true` | Any settings file; any-source-true | All claude.ai connectors Claude Code fetches itself (not desktop- or cloud-delivered ones). Same as `ENABLE_CLAUDEAI_MCP_SERVERS=false` |

`deniedMcpServers` is not only for admins: a user can block servers for themselves, and `allowManagedMcpServersOnly` never stops the denylist merging. A blocked server "disappears from `/mcp` and `claude mcp list`" with no message saying why. CHANGELOG v2.1.299: `claude mcp list`/`get` now report a policy-blocked server as blocked without starting it; the docs still say it disappears (not re-tested).

A `serverName` entry "is not a security control": anyone can name any server `github`. Use `serverUrl` or `serverCommand` when it matters. For a connector, `{ "serverName": "claude.ai Slack" }` works in the denylist; the allowlist accepts only letters, digits, `-` and `_` in names.

Unset `allowedMcpServers` allows everything; `[]` allows nothing but built-ins and org-provided servers.

## [MCP-004] Permission rules for MCP tools
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Permissions: MCP](https://code.claude.com/docs/en/permissions#mcp), [Permission modes: auto mode](https://code.claude.com/docs/en/permission-modes), [Permissions: tool name wildcards](https://code.claude.com/docs/en/permissions#tool-name-wildcards), [Permissions: match by input parameter](https://code.claude.com/docs/en/permissions#match-by-input-parameter), [MCP: plugin MCP tool names](https://code.claude.com/docs/en/mcp#plugin-provided-mcp-servers)
- Related: MCP-009, MCP-010, MCP-015, HOOK-018, REPO-033, INFRA-006

Tool names are `mcp__<server>__<tool>`; plugin tools are `mcp__plugin_<plugin>_<server>__<tool>`; connectors Claude Code fetches are `mcp__claude_ai_<name>__<tool>` (spaces become `_`, e.g. `mcp__claude_ai_MongoDB_Atlas__drop-database`).

Rule forms:
- `mcp__github` or `mcp__github__*`: every tool on that server.
- `mcp__github__get_*`: allow globs work only after a literal `mcp__<server>__` prefix. "An unanchored allow glob such as `"*"`, `"B*"`, or `"mcp__*"` is skipped with a warning and doesn't auto-approve anything."
- Deny and ask take any glob: `"mcp__*"` in `deny` removes every MCP tool from Claude's context.
- **No parameter rules in settings.** "When Claude Code loads a settings file, it skips any `mcp__` rule that has parentheses." A deny on one argument value works only through `--disallowedTools`.

Rules use the canonical name, not the display label. A hook matcher on the bare server key (`mcp__database-tools__.*`) "never fires for a plugin-bundled server"; same trap for permission rules and a subagent's `tools`.

Prompts that no allow rule skips: tools a server marks `_meta["anthropic/requiresUserInteraction"]: true`, and connector tools an organization set to `ask`. Both prompt "even in `acceptEdits`, `auto`, and `bypassPermissions`"; `dontAsk` denies them.

An explicit `ask` rule "still force[s] a prompt" in auto mode, so allowing a server's reads and listing its write tools under `ask` gives unattended reads and an approval per write (MCP-028).

Since v2.1.299 a rule `mcp__a` reaches only the server named `a` (it no longer also allows `a__b` or `a_`); for a server whose name contains `__`, write `mcp__<whole name>__*`. Deny and ask rules for such servers also apply from v2.1.299.

Deny rules decide what the model may call; what the server can do with its credential is set by the credential (INFRA-006).

## [MCP-005] Secrets in MCP config: `${VAR}` expansion and what reads as empty
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [MCP: environment variable expansion](https://code.claude.com/docs/en/mcp#environment-variable-expansion-in-mcp-json), [MCP: configuration warnings](https://code.claude.com/docs/en/mcp#configuration-warnings)
- Related: MCP-001, MCP-006, MCP-007

`.mcp.json` expands `${VAR}` and `${VAR:-default}` in `command`, `args`, `env`, `url` and `headers`. Commit `"Authorization": "Bearer ${API_KEY}"` and keep the value in the environment; or keep a server with a literal key at local or user scope, which never enters git.

**Credential variables read as empty** in a remote server's `url` and `headers`, set or not, and `:-default` is ignored: Claude Code's own (`ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`), cloud-provider ones (`AWS_BEARER_TOKEN_BEDROCK`) and others such as `HTTPS_PROXY` and `NPM_TOKEN`. This stops a repo's `.mcp.json` or a plugin from sending your credentials to a server it names. The symptom is a `401` reported as a failed connection; the debug log says `never expanded toward a remote server`. Copy the value into a variable with your own name.

An unset variable with no default loads the server anyway, with the literal `${VAR}` text, and a warning in `claude mcp list` and `/mcp`.

Claude Code warns, without echoing values, about leading or trailing whitespace in `command`, `url`, `args`, `env` and `headers` (a pasted token with a newline), but uses the value as written. `/mcp` and `claude mcp list` show `${VAR}` references by name (`/mcp` detail since v2.1.268).

## [MCP-006] Signing in to remote servers: OAuth from `/mcp` or the shell
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [MCP: authenticate with remote MCP servers](https://code.claude.com/docs/en/mcp#authenticate-with-remote-mcp-servers)
- Related: MCP-005, MCP-007, SESS-013

A `401` or `403` from a remote server you haven't signed in to flags it in `/mcp`; sign in there, or from a shell with `claude mcp login <name>`. That command detects a missing browser (SSH, Linux without a display) and prints the URL instead; paste the redirect URL back. `--no-browser` forces this. `claude mcp logout <name>` clears it.

**Headless runs can't sign in.** In `claude -p` and the SDK, Claude is told the server's tools are unavailable until you authorize it interactively. Sign in once before scheduling scripted runs.

Refresh: on a `401` Claude Code refreshes the stored token, reconnects and retries once. A rejected refresh token shows a notice pointing at `/mcp` → **Re-authenticate**.

Options in the server's `oauth` object:
- `scopes`: "the supported way to restrict an MCP server to a security-team-approved subset", a space-separated string. `offline_access` is appended when advertised. A later 403 `insufficient_scope` names the missing scope; add it and sign in again.
- `clientId`/`--client-id`, `--client-secret` (prompted, stored in the keychain or a credentials file, settable only when adding), `callbackPort`/`--callback-port` for a pre-registered `http://localhost:PORT/callback`.
- `authServerMetadataUrl` (https only) to bypass discovery.

A configured `Authorization` header that the server rejects is reported as a failed connection, with no fallback to OAuth.

## [MCP-007] `headersHelper`: short-lived tokens without OAuth
- Type: pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [MCP: use dynamic headers for custom authentication](https://code.claude.com/docs/en/mcp#use-dynamic-headers-for-custom-authentication)
- Related: MCP-005, MCP-006, INFRA-024

For a remote server behind Kerberos, SSO or short-lived tokens, set `headersHelper` to a command that prints a JSON object of headers:

```json
{ "mcpServers": { "internal-api": {
  "type": "http", "url": "https://mcp.internal.example.com",
  "headersHelper": "/opt/bin/get-mcp-auth-headers.sh" } } }
```

Behaviour:
- Runs in a shell, "gives up on it after 10 seconds", on every connect and reconnect; no caching, so the script reuses tokens itself.
- On a `401` or `403` from a tool call it reruns the helper, reconnects and retries once.
- Its headers override static `headers`; an `Authorization` header disables OAuth for that server.
- Receives `CLAUDE_CODE_MCP_SERVER_NAME` and `CLAUDE_CODE_MCP_SERVER_URL`, so one script can serve several servers.

**Trust and environment.** For a project `.mcp.json` or local-scope server, the helper runs only after the trust dialog for that exact folder (since v2.1.238; earlier `-p` ran it unchecked). A helper from a project `.mcp.json`, a plugin or a project agent file runs without any variable whose name contains `TOKEN`, `SECRET`, `PASSWORD`, `KEY` or `AUTH`, so it must read its credential from a file or store. User-scope helpers keep the environment and run from `~/.claude`.

Use an absolute path: the working directory depends on where the server is configured.

## [MCP-008] Scope a server to one subagent with inline `mcpServers`
- Type: pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Subagents: scope MCP servers to a subagent](https://code.claude.com/docs/en/sub-agents#scope-mcp-servers-to-a-subagent)
- Related: REPO-007, REPO-012, REPO-021, REPO-053, TOK-022, MCP-002

An agent file's `mcpServers` list takes inline definitions (same schema as `.mcp.json`) or names of servers already configured:

```yaml
mcpServers:
  - playwright:            # inline: only this subagent gets it
      type: stdio
      command: npx
      args: ["-y", "@playwright/mcp@latest"]
  - github                 # name: shares the parent's connection
```

"To keep an MCP server out of the main conversation entirely and avoid its tool descriptions consuming context there, define it inline here rather than in `.mcp.json`." Inline servers connect when the subagent starts and disconnect when it finishes, so a stdio server's process lives only for the run.

Limits:
- A project agent file's inline servers load only once that exact folder is trusted (since v2.1.238); a parent folder's trust and `-p` don't count. Agents in `~/.claude/agents/`, `--agents` and managed settings skip this check.
- `--strict-mcp-config`, `--bare` and managed allow/deny lists also filter frontmatter servers.
- Plugin agents ignore `mcpServers` (REPO-012); copy the file into `.claude/agents/` to use it.
- With `tools` omitted, a subagent inherits every MCP tool of the parent; list tools or use `disallowedTools: mcp__<server>` to cut them. Since v2.1.299 a `tools:` entry `mcp__a` takes only server `a`'s tools; name a server containing `__` as `mcp__<whole name>__*`.
- An agent's own inline server isn't limited by `tools`: all its tools reach the agent, so deny the dangerous ones with `disallowedTools` (REPO-053).

Fits a server one agent needs and the main thread never does, such as a browser checker (REPO-021).

## [MCP-009] Plugin-bundled MCP servers
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [MCP: plugin-provided MCP servers](https://code.claude.com/docs/en/mcp#plugin-provided-mcp-servers), [Plugins reference](https://code.claude.com/docs/en/plugins-reference)
- Related: MCP-004, MCP-001, SKILL-033, SKILL-041, REPO-012

A plugin declares servers in `.mcp.json` at its root or inline in `plugin.json`; they start when the plugin is enabled and stop when it's disabled. You add or remove them by installing or uninstalling the plugin, not with `claude mcp`, though `/mcp` can still toggle one off.

Names:
- Tools: `mcp__plugin_<plugin>_<server>__<tool>`, with characters outside `A-Za-z0-9_-` replaced by `_` (ours: `mcp__plugin_playwright_playwright__browser_snapshot`). Use this in permission rules, `allowed-tools`, a subagent's `tools` and hook matchers.
- Server: `plugin:<plugin>:<server>`, for places that want a server name, such as an `mcp_tool` hook's `server` field.

Placeholders `${CLAUDE_PLUGIN_ROOT}`, `${CLAUDE_PLUGIN_DATA}` and `${CLAUDE_PROJECT_DIR}` expand in a stdio server's `command`, `args` and `env`, and in a remote server's `url`, `headers` and `headersHelper`. A plugin's `headersHelper` can't use `${user_config.*}` (since v2.1.207); put those in `headers`.

Precedence: plugin servers rank below local, project and user servers, and are matched by endpoint, so the same URL configured by hand wins (MCP-001).

Plugin servers run outside the permission sandbox like any MCP server; read a plugin's `.mcp.json` before enabling it (SKILL-041).

## [MCP-010] claude.ai connectors in Claude Code
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [MCP: use MCP servers from claude.ai](https://code.claude.com/docs/en/mcp#use-mcp-servers-from-claude-ai), [MCP: how connectors reach Claude Code](https://code.claude.com/docs/en/mcp#how-connectors-reach-claude-code), [Desktop on WSL](https://code.claude.com/docs/en/desktop-wsl), local test
- Related: MCP-003, MCP-004, MCP-022, MCP-023, MCP-028, SURF-034

Connectors you add at claude.ai/customize/connectors show up in Claude Code's `/mcp` as `claude.ai <Name>`, with tools named `mcp__claude_ai_<Name>__<tool>`. Anthropic adds some itself, such as `claude.ai Claude Docs`.

They arrive only with a claude.ai subscription login, not with `ANTHROPIC_API_KEY`, `apiKeyHelper`, Bedrock or Agent Platform, or a `setup-token` token.

| Session | How they arrive | What controls them |
|---|---|---|
| Terminal, IDEs, Agent SDK | Claude Code fetches them | `/mcp` toggle, `deniedMcpServers`, `disableClaudeAiConnectors` |
| Cloud sessions | Cloud host passes them in | claude.ai org settings, allow/deny lists (connector URLs are rewritten, so `serverUrl` patterns miss) |
| Desktop local and SSH | In-process `type: "sdk"` servers | Only disconnecting at claude.ai or org `blocked` tool controls; "no MCP setting or `managed-mcp.json` reaches them" |

A server you add with the same URL hides the connector.

Tested 2026-10-13, v2.1.296, WSL terminal `-p`: two connectors were connected, MongoDB Atlas (42 tools, including `drop-database`, `delete-many` and `atlas-create-db-user`) and Claude Docs (8). Tested 2026-10-13, desktop WSL session (CLI 2.1.295): three connectors arrived mid-session as servers named by a UUID (`mcp__<uuid>__find`), although the WSL page says "connectors and plugins" aren't available in WSL sessions. Rules written for `mcp__claude_ai_…` names don't match those.

## [MCP-011] Timeouts, reconnection and backgrounded tool calls
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [MCP: timeouts](https://code.claude.com/docs/en/mcp), [MCP: automatic reconnection](https://code.claude.com/docs/en/mcp#automatic-reconnection), [MCP: automatic backgrounding](https://code.claude.com/docs/en/mcp#automatic-backgrounding-of-long-tool-calls), [Env vars](https://code.claude.com/docs/en/env-vars)
- Related: MCP-012, TOK-023, SESS-013

| Limit | Default | Set with |
|---|---|---|
| Server startup | 30 s | `MCP_TIMEOUT` |
| Tool call, wall clock | about 28 hours (100,000,000 ms) | `MCP_TOOL_TIMEOUT`, or per-server `"timeout"` in ms (values under 1000 ignored) |
| Per request to first byte (HTTP, SSE, connectors) | 60 s, or the tool timeout or `MCP_TIMEOUT` if higher | those settings |
| Idle (no response, no progress) | 5 min network servers, 30 min stdio (stdio since v2.1.203) | `CLAUDE_CODE_MCP_TOOL_IDLE_TIMEOUT`, `0` off |
| Move to background | 2 min, main conversation only (v2.1.212+) | `CLAUDE_CODE_MCP_AUTO_BACKGROUND_MS`, `0` off |

Backgrounded calls appear in `/tasks` and return as a task notification. Subagent calls, IDE servers and `-p` runs (unless `CLAUDE_AUTO_BACKGROUND_TASKS=1`) never background.

**Reconnection.** A remote server that drops is retried up to five times with backoff from 1 s; a first connection gets three retries on transient errors (not on auth or 404). **Stdio servers are never reconnected automatically**: a crashed local server stays failed until you reconnect it in `/mcp` or run `/mcp reconnect all` (v2.1.284+). In `claude -p` and the SDK, a remote server that keeps failing with a transient error is retried in the background for up to about half an hour.

With tool search on, Claude is told which server failed and why, so it can say so instead of guessing. Without tool search, it isn't told.

## [MCP-012] MCP startup and context cost in scripted runs
- Type: recommendation
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Agent SDK MCP: connection timing](https://code.claude.com/docs/en/agent-sdk/mcp#connection-timing), [Env vars](https://code.claude.com/docs/en/env-vars), [MCP: project scope](https://code.claude.com/docs/en/mcp#project-scope), local test
- Related: MCP-002, MCP-011, TOK-020, ORCH-014, MEM-028

Every `claude -p` run starts every configured server: user scope, approved project servers, plugin servers and connectors. Startup is non-blocking. The first turn waits for pending servers. With only settings-file servers and tool search on, it waits up to 2 seconds, and only for `alwaysLoad` servers; `CLAUDE_CODE_MCP_STARTUP_WAIT_MS` (v2.1.274+) sets that wait, and `0` skips it (v2.1.284+: servers named by `--allowedTools` or an `mcp_tool` hook are still waited for, up to 2 s). With `-p`, `--mcp-config` makes the first turn wait for pending servers up to `MCP_TIMEOUT` (30 s default, v2.1.221+).

For a scripted run that needs no MCP, pass `--strict-mcp-config` (with no `--mcp-config`) or `--bare` (API-key auth only: it never reads the claude.ai login); pass `--mcp-config file.json --strict-mcp-config` for exactly the servers it needs.

Tested 2026-10-13, v2.1.296, WSL terminal, Haiku 5.5, `claude -p "Reply with the single word ok." --model haiku --max-turns 1 --max-budget-usd 0.05 --output-format json`, three runs each, in a scratch folder:
- Default: 8 servers, 152 tools of which 120 MCP; 39,917–40,993 input tokens; 5.4–6.7 s wall clock.
- `--strict-mcp-config`: no servers, 29 tools; 34,354–34,357 input tokens; 3.6–3.7 s, plus one 8.0 s outlier (the first run).

So our servers add about 6,600 tokens per request, even with every tool deferred (names and server instructions), and about 2 s per run. Each run also spawns its own server processes (SESS-013).

## [MCP-013] Resources, prompts and elicitation
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [MCP: use MCP resources](https://code.claude.com/docs/en/mcp#use-mcp-resources), [MCP: use MCP prompts as commands](https://code.claude.com/docs/en/mcp#use-mcp-prompts-as-commands), [MCP: respond to elicitation requests](https://code.claude.com/docs/en/mcp#respond-to-mcp-elicitation-requests)
- Related: MCP-014, HOOK-002

Beyond tools, Claude Code supports three server features.

**Resources.** Type `@` to see them next to files; reference as `@server:protocol://path`, e.g. `@github:issue://123`. A referenced resource is fetched and attached. Claude also gets tools to list and read resources when a server offers them. MCP Apps UI resources (`ui://`) are left out of the list.

**Prompts** become commands: `/servername:promptname (MCP)` in the `/` menu, also runnable as `/mcp__server__prompt arg1 arg2`. Arguments split on whitespace, so each is one token. The result is injected into the conversation. A server named `anthropic-skills` has its prompts hidden (the name is reserved).

**Elicitation.** A server can ask you for input mid-task: a form dialog, or a URL to open (sign-in flows). URLs over about 8,000 escaped characters can only be declined. The `Elicitation` hook can answer without a dialog. In `-p` there's no dialog to show.

When to use them: resources suit stable reference data you want to attach by name; prompts are a server-shipped alternative to a skill, without its progressive disclosure. A skill in the repo is easier to version and review than a prompt that changes on the server.

## [MCP-014] Client runtimes, protocol 2026-07-28 and supported features
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [MCP: client runtimes](https://code.claude.com/docs/en/mcp#mcp-client-runtimes), [MCP: dynamic tool updates](https://code.claude.com/docs/en/mcp#dynamic-tool-updates), [MCP spec versioning](https://modelcontextprotocol.io/specification/versioning), [CHANGELOG](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md), [claude-code#1785](https://github.com/anthropics/claude-code/issues/1785)
- Related: MCP-013, MCP-019, MCP-027

The current MCP spec is **2026-07-28** (stateless; roots, sampling and logging deprecated; tasks moved to an extension). Claude Code has two client runtimes: v1 on MCP TypeScript SDK 1.x and v2 on SDK 2.0, which adds revision 2026-07-28. v2 is used from v2.1.232 where feature flags are fetched, and by default from v2.1.274 elsewhere. `MCP_SDK_GENERATION=v1|v2` picks one; `MCP_PROTOCOL_NEGOTIATION=legacy` keeps every server on the old handshake (needed for stdio channel servers, MCP-027). v2 also refuses to send OAuth credentials to a non-HTTPS token endpoint other than localhost.

| Feature | Claude Code |
|---|---|
| Tools, `structuredContent`, `resource_link` | Yes |
| Resources, prompts | Yes (MCP-013) |
| Elicitation, form and URL | Yes |
| Roots | Launch dir plus `--add-dir` dirs (CHANGELOG v2.1.203) |
| `list_changed` | Yes: interactive refetches tools, prompts and resources; `-p` and the SDK only tools |
| Sampling | Not documented; open issue #1785 (single-source), and the spec now deprecates it |
| Tasks extension | Not documented; Claude Code backgrounds long calls itself (MCP-011) |

A changed tool list is accepted without a new approval; Claude Code has no tool-definition pinning (MCP-019).

## [MCP-015] Server-side knobs Claude Code reads
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [MCP: require approval for a specific tool](https://code.claude.com/docs/en/mcp#require-approval-for-a-specific-tool), [MCP: tool input schemas](https://code.claude.com/docs/en/mcp#tool-input-schemas-with-a-root-level-combinator), [MCP: tool search for server authors](https://code.claude.com/docs/en/mcp#tool-search-for-mcp-server-authors), [MCP: output limits](https://code.claude.com/docs/en/mcp#mcp-output-limits-and-warnings), [MCP tools spec](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
- Related: MCP-004, MCP-018, TOK-020, TOK-023

For anyone writing a server Claude Code will use:
- `_meta["anthropic/requiresUserInteraction"]: true` (JSON `true` only): a prompt on every call, in every mode, with no "don't ask again"; denied in `dontAsk`. For consent steps (v2.1.214+ withholds one-tap approval on Remote Control).
- `_meta["anthropic/maxResultSizeChars"]`: lets one tool exceed the 50,000-character save-to-file threshold (up to 500K per CHANGELOG v2.1.91).
- `_meta["anthropic/alwaysLoad"]`: load a tool up front; `false` keeps it deferred (v2.1.285+).
- Server `instructions`: loaded at start with tool names under tool search; say what the server is for and when to search for its tools. Cut at 4,096 characters, as is a tool description that loads upfront; one loaded through tool search is cut at 16,384. `CLAUDE_CODE_MAX_MCP_DESCRIPTION_LENGTH` (v2.1.280+) replaces both, and since v2.1.299 Anthropic's own `api.anthropic.com` servers aren't cut (TOK-020). A tool whose full `mcp__<server>__<tool>` name exceeds 128 characters is left out (v2.1.292+).

Schemas: a root-level `anyOf`/`oneOf`/`allOf` is flattened and explained in the description, so validate argument combinations server-side. Tools whose property names break the API's rules (1–64 chars of `A-Za-z0-9_.-`) or whose schema isn't valid draft 2020-12 are dropped with a reason (v2.1.216+), not the whole request.

**Annotations** (`readOnlyHint`, `destructiveHint`) show in `/mcp`, but no Claude Code page says they change permissions; the spec says clients "MUST consider tool annotations to be untrusted unless they come from trusted servers". Unverified whether Claude Code acts on them.

## [MCP-016] Managed MCP patterns and what a solo user can use
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Managed MCP](https://code.claude.com/docs/en/managed-mcp)
- Related: MCP-003, MCP-001

| Pattern | Configure |
|---|---|
| Disable MCP | `managed-mcp.json` with an empty map |
| Fixed deployment | `managed-mcp.json` with the servers; users can't add others |
| Provided servers | `managedMcpServers` (remote only) in managed settings |
| Approved catalog | `allowedMcpServers` + `allowManagedMcpServersOnly: true` |
| Plugin servers only | `strictPluginOnlyCustomization` including `mcp` |
| Soft allowlist | `allowedMcpServers` alone (users can broaden it) |
| Denylist only | `deniedMcpServers` |

`managed-mcp.json` lives at a system path (`/etc/claude-code/` on Linux) and can't come from server-managed settings. Evaluation: lists merge from every scope, the denylist is checked first and wins, then the allowlist (a stdio server needs a `serverCommand` match and a remote one a `serverUrl` match once any such entry exists). Built-ins, org-provided servers and in-process SDK servers skip the allowlist. `--strict-mcp-config` doesn't bypass either list. "Claude Code doesn't have a built-in MCP server registry."

**For one person**, only the denylist and allowlist in `~/.claude/settings.json` matter. A user-level `allowedMcpServers` is a guard against accidentally added servers, not a security control: anything that can edit the file can widen it. OpenTelemetry with `OTEL_LOG_TOOL_DETAILS=1` records which servers and tools get called.

## [MCP-017] CLI, skill or MCP server?
- Type: comparison
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Best practices: use CLI tools](https://code.claude.com/docs/en/best-practices), [Features overview](https://code.claude.com/docs/en/features-overview), [Writing effective tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents), [What if you don't need MCP (Zechner)](https://mariozechner.at/posts/2025-11-02-what-if-you-dont-need-mcp/), [Skills vs dynamic MCP loadouts (Ronacher)](https://lucumr.pocoo.org/2025/12/13/skills-vs-mcp/)
- Related: TOK-022, SKILL-021, MCP-018, INFRA-007

Official: "CLI tools are the most context-efficient way to interact with external services" (`gh`, `aws`, `gcloud`, `sentry-cli`). MCP "gives Claude purpose-built tools for an external system, with the connection and authentication handled by the server"; a skill teaches how to use them. Trigger for MCP: "You keep copying data from a browser tab Claude can't see."

| Need | Use |
|---|---|
| A CLI exists that Claude knows | The CLI, plus a skill or CLAUDE.md line for your conventions |
| No CLI; OAuth or a hosted API | An MCP server (remote if offered) |
| Credential the agent must never see | MCP server holding it, or a scoped identity (INFRA-006) |
| Output too large for context | CLI with filters, or a server with pagination (INFRA-007) |
| Repeatable procedure over any of these | A skill |

Community view (Zechner 2025-11-02, Ronacher 2025-12-13): MCP results can't be piped or composed, and servers "keep changing their tool descriptions at will". Their token-cost argument (Playwright MCP "21 tools using 13.7k tokens") is weaker since tool search defers schemas (TOK-020); the composability and stability points stand. Trust the official rule for Claude Code behaviour, the community for the trade-off.

**Building one:** few workflow-shaped tools beat API mirrors: "consider implementing a `schedule_event` tool which finds availability and schedules an event" instead of three list/create tools.

## [MCP-018] Designing a server: rules from `mcp-builder`
- Type: recommendation
- Applies to: general
- Confidence: official-example
- Last verified: 2026-10-14
- Sources: [mcp-builder SKILL.md](https://raw.githubusercontent.com/anthropics/skills/main/skills/mcp-builder/SKILL.md), [mcp-builder best practices](https://raw.githubusercontent.com/anthropics/skills/main/skills/mcp-builder/reference/mcp_best_practices.md), [Writing effective tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents), [Connector review criteria](https://claude.com/docs/connectors/building/review-criteria)
- Related: MCP-015, MCP-017, MCP-019

Anthropic's `mcp-builder` skill (anthropics/skills) encodes these rules:
- **Names:** server `{service}-mcp-server` (Node) or `{service}_mcp` (Python); tools snake_case with a service prefix, `{service}_{action}_{resource}`.
- **Output:** support JSON and Markdown (`response_format`); paginate with `limit`, `has_more`, `next_offset`, `total_count`, "Default to 20-50 items"; cap at `CHARACTER_LIMIT = 25000` with a truncation message.
- **Errors:** `isError: true` with text that says what to do next.
- **Transport:** Streamable HTTP for remote, stdio for local, "Avoid SSE". TypeScript recommended.
- **Annotations:** set `readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`; "Annotations are hints, not security guarantees."
- **Evaluation:** 10 independent, read-only, realistic questions with string-checkable answers.

Tension: `mcp-builder` says "When uncertain, prioritize comprehensive API coverage"; the engineering post says "We recommend building a few thoughtful tools targeting specific high-impact workflows." For an agent-only server, follow the post: fewer tools mean less to choose between (TOK-021: selection degrades past 30–50 tools).

The directory review criteria add: no catch-all `api_request` tool mixing reads and writes, tool names of 64 characters or fewer, and no descriptions that steer Claude toward other tools.

## [MCP-019] Vetting a third-party server
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [MCP: local server security](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/local-server-security), [MCP security best practices](https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices), [Claude Code security: MCP](https://code.claude.com/docs/en/security), [API MCP connector: pin the tool list](https://platform.claude.com/docs/en/agents-and-tools/mcp-connector), [Lethal trifecta (Willison)](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)
- Related: MCP-014, MCP-020, SKILL-041, INFRA-006, REPO-037

Claude Code's position: "We encourage either writing your own MCP servers or using MCP servers from providers that you trust"; Anthropic "does not security-audit or manage any MCP server", directory listings included.

The spec's local-server guide treats a stdio server as "untrusted code with exactly the privileges you hand it". Checklist:
1. Prefer the vendor's remote server where one exists.
2. Check the publisher and exact package name (typosquats); pin the version. Pinning in `npx`/`uvx` "fixes only the top-level package"; an image digest freezes the tree.
3. Read the tool list and descriptions before relying on it (MCP Inspector or `/mcp`).
4. Give each server its own narrowly scoped token; never pass your session's credentials (MCP-005).
5. Restrict filesystem roots and network egress, e.g. a container with `--network=none` where possible.
6. Avoid one session holding private data, untrusted content and an exfiltration path at once (the lethal trifecta).

**Rug pulls.** "a server can quietly change them after you approved it (a rug pull), so a one-time consent dialog and package pinning do not cover this surface." Claude Code refreshes on `list_changed` with no re-approval (MCP-014). The API connector can pin a server's tool list (`mcp-client-2026-09-15` beta); Claude Code can't. So re-read a server's tools after each upgrade, and prefer servers from the vendor of the system they touch.

## [MCP-020] Finding servers: Anthropic Directory and the MCP Registry
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [MCP: find and build MCP servers](https://code.claude.com/docs/en/mcp#find-and-build-mcp-servers), [MCP Registry: about](https://modelcontextprotocol.io/registry/about), [MCP Registry: moderation policy](https://modelcontextprotocol.io/registry/moderation-policy), [Connector review criteria](https://claude.com/docs/connectors/building/review-criteria)
- Related: MCP-019, MCP-016

The Claude Code docs point to one catalog: "Browse reviewed connectors in the Anthropic Directory" (claude.ai/directory). Directory review is an automatic scan, a "Community" label by default and a "Verified" review for some. It isn't a security audit (MCP-019).

The official **MCP Registry** (registry.modelcontextprotocol.io, backed by Anthropic, GitHub, PulseMCP and Microsoft) "is currently in preview. Breaking changes or data resets may occur before general availability." It is "intended to be consumed primarily by downstream aggregators", and "consumers should assume minimal-to-no moderation." The Claude Code MCP page doesn't mention it, and Claude Code has no built-in browser for it (MCP-016).

Use the Directory or the vendor's own docs to find a server; treat a registry listing as a pointer to a package, not as a recommendation. The `mcp-server-dev` plugin in claude-plugins-official helps build one.

## [MCP-021] MCP in `claude-code-action`
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Action configuration](https://raw.githubusercontent.com/anthropics/claude-code-action/main/docs/configuration.md), [Action FAQ](https://raw.githubusercontent.com/anthropics/claude-code-action/main/docs/faq.md), [install-mcp-server.ts](https://raw.githubusercontent.com/anthropics/claude-code-action/main/src/mcp/install-mcp-server.ts), [GitHub Actions](https://code.claude.com/docs/en/github-actions)
- Related: REPO-028, REPO-037, MCP-002

Latest action release read: v1.0.248 (2026-10-09).

**Your servers:** pass `--mcp-config <file>` in `claude_args` (several flags merge; the `mcp_config` input is deprecated). Same-name custom servers override built-ins. A repo `.mcp.json` is loaded too: "The `enableAllProjectMcpServers` setting is always set to `true` by this action", but its tools "still need to be explicitly allowed" with `--allowedTools`. On PR events `.mcp.json` comes from the base branch (REPO-028).

**Built-in servers** (from the source; the FAQ says two):
- `github_comment` (updates the tracking comment): tag mode always.
- `github_inline_comment`: PR runs whose `allowedTools` name `mcp__github_inline_comment…` or the `mcp__github` / `mcp__github__*` selector (source: `install-mcp-server.ts`, read 2026-10-14).
- `github_ci` (CI status, run details, job logs): PR runs with `actions: read`.
- `github_file_ops` (commit, delete files): with `use_commit_signing`.
- `github` (official GitHub MCP server in Docker, pinned by SHA): when `allowedTools` has `mcp__github__*`.

**Secrets:** write the config in a step from `${{ secrets.X }}`, never in the workflow file. The file then holds the plaintext token on the runner, so keep it in the runner's temp dir.

Allow exact tool names (`mcp__github_inline_comment__create_inline_comment`), not `mcp__github__*`, unless the job needs the full GitHub server.

## [MCP-022] MCP in cloud sessions and routines
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Cloud environments](https://code.claude.com/docs/en/cloud-environments), [Routines](https://code.claude.com/docs/en/routines), [MCP: how connectors reach Claude Code](https://code.claude.com/docs/en/mcp#how-connectors-reach-claude-code), [Claude Code on the web](https://code.claude.com/docs/en/claude-code-on-the-web)
- Related: MCP-010, MCP-002, MEM-026, REPO-030, SURF-026

**Cloud sessions** get:
- The repo's `.mcp.json`, loaded without approval (single-repo sessions).
- claude.ai connectors, passed in by the host and authenticated by its proxy with your claude.ai grant.

They don't get local or user scope servers from `~/.claude.json` ("Add the server with `claude mcp add --scope project` … and commit that file") or plugins enabled in the repo, so plugin-bundled servers are missing.

Network: "MCP connectors you enable on a session or routine work without adding their hosts to **Allowed domains**", because their traffic goes through Anthropic. A `.mcp.json` server that calls your own host goes through the session's network and needs that host allowed (inferred from the same page).

**Routines:** "all of your connected MCP connectors are included by default. Remove any the routine doesn't need: Claude can use every tool from an included connector, including writes, without asking for permission during a run." Actions run as your linked accounts. Local `claude mcp add` servers don't appear; a single-repo routine can use a committed `.mcp.json`.

A cloud session waiting for you to approve a connector call counts as inactive and can expire.

So: trim connectors per routine, and give a routine only connectors whose write tools you'd accept unattended.

## [MCP-023] Desktop app: which MCP config reaches a Code tab session
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Desktop](https://code.claude.com/docs/en/desktop), [Desktop on WSL](https://code.claude.com/docs/en/desktop-wsl), [MCP: import from Claude Desktop](https://code.claude.com/docs/en/mcp#import-mcp-servers-from-claude-desktop), [MCP: scope precedence](https://code.claude.com/docs/en/mcp#scope-hierarchy-and-precedence)
- Related: MCP-010, SURF-034, SKILL-047, SKILL-053

Local (Windows or macOS) Code tab sessions: "The Desktop app loads MCP servers from `claude_desktop_config.json` into local Code tab sessions, alongside servers from `~/.claude.json` and `.mcp.json`."
- Same name in the chat config and `.mcp.json`: the chat config wins.
- Same stdio name at user scope and in `.mcp.json`: the Code tab uses `~/.claude.json`, unlike the CLI order (MCP-001).
- "The standalone CLI does not read `claude_desktop_config.json`."
- Connectors arrive in-process (MCP-010).

WSL sessions run the distro's CLI build and read only the distro's config; `claude_desktop_config.json` doesn't reach them (SURF-034). The desktop passes `deniedMcpServers` in its launch settings there (SURF-034).

`claude mcp add-from-claude-desktop` imports the chat app's servers; "This feature only works on macOS and Windows Subsystem for Linux (WSL)". Names with characters other than letters, digits, `-` and `_` are skipped; duplicates get `_1`. Use `--scope user` to import to user scope.

Whether Desktop Extensions (`.mcpb`) reach Code tab sessions isn't documented.

## [MCP-024] Agent SDK: MCP servers, in-process tools and defaults
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Agent SDK: MCP](https://code.claude.com/docs/en/agent-sdk/mcp), [Agent SDK: Claude Code features](https://code.claude.com/docs/en/agent-sdk/claude-code-features), [Agent SDK: custom tools](https://code.claude.com/docs/en/agent-sdk/custom-tools)
- Related: MEM-028, ORCH-015, MCP-012, MCP-002

With `settingSources` omitted, `query()` reads user, project and local settings like the CLI, so a project `.mcp.json` loads without approval. `~/.claude.json` servers load regardless, and with a claude.ai login connectors load too: "Passing `mcpServers: {}` does not suppress the connectors."

For a reproducible agent, set `strictMcpConfig: true` (Python `strict_mcp_config=True`): "Use only the servers passed in `mcpServers` and ignore project `.mcp.json`, user settings, plugin-provided MCP servers, and claude.ai connectors".

**In-process tools:** wrap `tool()`/`@tool` functions with `createSdkMcpServer`/`create_sdk_mcp_server` and pass the result in `mcpServers`. They run inside your app, no process to spawn; names are `mcp__{server}__{tool}`. The Python `@tool` forwards only `content` and `is_error`; use a standalone server for `structuredContent`.

Permissions: list MCP tools in `allowedTools` (`mcp__github__*`, `mcp__db__query`). "`permissionMode: "acceptEdits"` does not auto-approve MCP tools." `canUseTool` receives `requiresUserInteraction` tools and may approve them, since your app is expected to show them to a person.

SDK MCP tools are deferred by tool search like CLI ones; the first-turn wait rules are in MCP-012.

## [MCP-025] Claude API MCP connector (`mcp_servers`)
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [MCP connector](https://platform.claude.com/docs/en/agents-and-tools/mcp-connector), [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- Related: TOK-024, TOK-021, MCP-019

The Messages API can call a remote MCP server itself. Beta header `mcp-client-2025-11-20` (`mcp-client-2025-04-04` is deprecated); `mcp-client-2026-09-15` adds everything in it plus tool-list recording and pinning (Claude API only).

Limits: "only tool calls are currently supported" (no resources or prompts). "The server must be publicly exposed through HTTP (supports both Streamable HTTP and SSE transports). Local STDIO servers cannot be connected directly." Platforms: Claude API, Claude Platform on AWS and Microsoft Foundry, all beta; Bedrock and Vertex aren't listed. Not eligible for zero data retention.

Shape: `mcp_servers: [{type: "url", url: "https://…", name, authorization_token}]`, plus one `{"type": "mcp_toolset", "mcp_server_name": …}` per server in `tools`, with `default_config` and per-tool `configs` taking `enabled` and `defer_loading`. You run the OAuth flow and refresh tokens yourself. Responses carry `mcp_tool_use` and `mcp_tool_result` blocks.

Cost: no MCP surcharge found; tool definitions and results are billed as tokens, so use `defer_loading` with tool search for large servers (TOK-021). For stdio servers or resources, run your own MCP client and use the SDK conversion helpers.

## [MCP-026] `claude mcp serve`: Claude Code as an MCP server
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [MCP: use Claude Code as an MCP server](https://code.claude.com/docs/en/mcp#use-claude-code-as-an-mcp-server), [CHANGELOG](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md)
- Related: MCP-014

`claude mcp serve` starts a stdio MCP server that exposes Claude Code's own tools to another client, such as Claude Desktop (`"command": "claude", "args": ["mcp", "serve"]`; `spawn claude ENOENT` means the path is wrong). It "only exposes Claude Code's tools to your MCP client, so your own client is responsible for implementing user confirmation for individual tool calls."

So the calling client gets Bash, Edit and Write with no Claude Code permission prompt in between. Only connect clients that confirm each call.

Tested 2026-10-13, v2.1.296, WSL terminal, `initialize` plus `tools/list` over stdio: server `claude/tengu` 2.1.296, protocol 2025-06-18, `tools` capability only. 28 tools, including Agent, Bash, Read, Edit, Write, WebFetch, WebSearch, Skill and the cron and worktree tools; no Grep or Glob. The set may vary by config and version.

CHANGELOG: v2.1.271 sends a progress update every 30 seconds during a call; v2.1.288 fixed the Agent tool in `claude mcp serve`.

## [MCP-027] Channels: servers that push events into a session
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Channels](https://code.claude.com/docs/en/channels), [Channels reference](https://code.claude.com/docs/en/channels-reference), [CHANGELOG](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md)
- Related: MCP-014, FLOW-014

"A channel is an MCP server that pushes events into your running Claude Code session", such as CI results, alerts or chat messages. The server declares `capabilities.experimental['claude/channel']` and sends `notifications/claude/channel`; it can also expose tools for replies and relay permission prompts (`claude/channel/permission`).

Research preview. Enable per session with `--channels plugin:<name>@<marketplace>` (v2.1.80+); `--dangerously-load-development-channels` for your own. Team and Enterprise orgs must turn on `channelsEnabled`, and `allowedChannelPlugins` (v2.1.84+) replaces Anthropic's allowlist. Needs claude.ai or Console auth; not on Bedrock, Agent Platform or Foundry. The ready-made Telegram, Discord and iMessage plugins need Bun.

On the v2 runtime, a channel server that negotiates protocol 2026-07-28 isn't registered; keep stdio channel servers on `MCP_PROTOCOL_NEGOTIATION=legacy`.

The docs describe only the terminal CLI; desktop, cloud and routines don't mention channels (not documented, not confirmed unsupported).

For us, a channel is a way to wake a session on a CI result without polling; the existing `gh pr checks --watch` background command already does that for PRs.

## [MCP-028] Our MCP setup as of 2026-10-13
- Type: fact
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-14
- Sources: [MCP: installation scopes](https://code.claude.com/docs/en/mcp#mcp-installation-scopes), [mongodb-mcp-server README](https://raw.githubusercontent.com/mongodb-js/mongodb-mcp-server/main/README.md), [Atlas cloud backups](https://www.mongodb.com/docs/atlas/backup/cloud-backup/overview/), local config (`~/.claude.json`, `~/.claude/settings.json`), `claude -p` init message, `ps`
- Related: INFRA-024, MCP-010, MCP-012, SESS-013, TOK-020

Read from local config and a `claude -p --output-format stream-json` init message on v2.1.296 in the WSL terminal.

| Server | Scope | Transport | Tools |
|---|---|---|---|
| `kubernetes`, `flux` | user | stdio, read-only | 14, 12 |
| `aws` (via `mcp-proxy-for-aws-cli`, pinned @1.7.0) | user | stdio | 8 |
| `analytics-mcp` | user | stdio | 9 |
| `context7` | user | http | 2 |
| `playwright` | plugin | stdio | 25 |
| `angular-cli` | osrs-tracker-web `.mcp.json` | stdio, `--read-only` | 3 allowed |
| `mongodb` (from 2026-10-13; replaced the claude.ai MongoDB Atlas connector, 42 tools) | osrs-tracker-api `.mcp.json` | stdio, `mongodb-mcp-server@3.0.5`, `--disabledTools atlas` | 27 |
| claude.ai Grafana Cloud (from 2026-10-14) | connector | remote, as the user (Editor) | 100+ deferred, including writes, kept on purpose (INFRA recommendation 11) |
| claude.ai Claude Docs | connector | remote | 8 |

On 2026-10-13, with the Atlas connector (since removed) and without Grafana Cloud: outside a repo, 8 servers, 120 MCP tools, about 6,600 tokens per request and about 2 s per `-p` run (MCP-012).

Permission rules: `~/.claude/settings.json` allows nine named tools (three `angular-cli`, six Playwright) and has no MCP deny rules, no `deniedMcpServers` and no `disableClaudeAiConnectors`. Auto mode decides the rest.

Gaps:
- Resolved 2026-10-13 (osrs-tracker/osrs-tracker-api#148, closed): the Atlas connector (42 tools, including `drop-database`, `delete-many` and `atlas-create-db-user`) was replaced by the official `mongodb-mcp-server@3.0.5` in that repo's `.mcp.json` with `--disabledTools atlas`, `ask` rules on nine write tools and a dedicated database user with `readWrite` on one database, and the connector was removed from the claude.ai account.
- `npx`-run servers use `@latest` (Playwright) and `kubernetes-mcp-server@0.0.67` is pinned; a `@latest` server can change its tools on any start (MCP-019).

---

## Recommendations for our setup

Ranked by impact against effort. Items 1, 3 and 4 change user config or another repo, so each needs your decision before an issue or change.

1. **Done 2026-10-13: replace the MongoDB Atlas connector with a scoped local server that can write** (high impact, low effort; osrs-tracker/osrs-tracker-api#148, closed). Decided 2026-10-13: Claude should do Atlas writes too, so read-only isn't the goal. The connector's 42 tools, including `drop-database` and `atlas-create-db-user`, reach every session on your Atlas account, and its desktop copies ignore every MCP setting. Opened as osrs-tracker/osrs-tracker-api#148:
   - a database user with `readWrite` on the one database, which bounds every path;
   - the official server pinned in that repo's `.mcp.json`, with `--disabledTools atlas` and its default confirmations for drops and `delete-many`;
   - `ask` rules on each write tool, which still prompt in auto mode;
   - a `mongodump` or preview `find` before multi-document writes, because free clusters have no cloud backups;
   - then the connector disconnected at claude.ai.
   MCP-010, MCP-028, MCP-004, MCP-019, INFRA-006.
2. **Pass `--strict-mcp-config` in scripted `claude -p` runs that don't need MCP** (medium impact, trivial effort). This saves about 6,600 tokens per request and about 2 s per run, and drops connector write tools from unattended runs. Add `--mcp-config` with only the servers a run needs. KB research probes should use it too. Opened 2026-10-14 as [FreekMencke/claude-kb#103](https://github.com/FreekMencke/claude-kb/issues/103): no repo has a scripted run, so it covers this repo's probe recipe and the global "Scripted Claude runs" rule. MCP-012, ORCH-014.
3. **Move rarely used stdio servers out of user scope** (medium impact, low effort). Each desktop session starts its own copy of every user-scope stdio server, about 0.8 GB RSS per session (SESS-013). `analytics-mcp` serves only web-analytics work and could become a project `.mcp.json` server in the repos that use it, or an inline server on a WEB agent. Opened 2026-10-14 as [FreekMencke/claude-kb#104](https://github.com/FreekMencke/claude-kb/issues/104), local scope in osrs-tracker-web, its only user so far: on 2026-10-14 its 6 copies (one per open session) took about 205 MB RSS each. MCP-001, MCP-008.
4. **Keep the Playwright plugin; pin `browser-checker`'s server** (low impact, low effort). Decided by 2026-10-14: osrs-tracker-web keeps the plugin as the session's headed browser, for sites that need a sign-in and for mocking API responses, and `browser-checker` runs its own headless, isolated server for osrs-tracker page checks (the repo's skill, read 2026-10-14). Disabling the plugin would drop the headed uses. What's left is the agent's `@playwright/mcp@latest`: pin it ([osrs-tracker/osrs-tracker-web#329](https://github.com/osrs-tracker/osrs-tracker-web/issues/329)). The plugin's own `@latest` is in the marketplace's `.mcp.json`, not ours to pin. REPO-021, MCP-019.
5. **Re-read a server's tool list after upgrading it** (low impact, trivial effort). Claude Code doesn't re-approve changed tools (MCP-014). Do this for `kubernetes-mcp-server` and `analytics-mcp` when their pins move. MCP-019.
6. **Don't add `deniedMcpServers` or `allowedMcpServers` for a solo setup beyond item 1**. Without a managed source they are guards, not boundaries, and a blocked server disappears silently. MCP-016, MCP-003.
7. **Done 2026-10-13: route MCP questions to this file.** `claude-kb-lookup`'s description now lists "MCP servers" ([FreekMencke/claude-skills#40](https://github.com/FreekMencke/claude-skills/pull/40), from [#39](https://github.com/FreekMencke/claude-skills/issues/39)). Its new trigger case (scoping a server to one subagent) loaded the skill 3 of 3 runs. The optional "adding an MCP server" in the "Use before …" clause was left out: it made a KB-editing near miss load the skill (SKILL-015).

## Open questions

- **Connectors in desktop WSL sessions.** The WSL page says "connectors and plugins" aren't available, yet on 2026-10-13 a desktop WSL session (CLI 2.1.295) received three connectors as UUID-named servers mid-session. Are the UUIDs stable across sessions, so a permission rule could name them? MCP-010.
- **Does Claude Code act on `readOnlyHint` or `destructiveHint`**, for example in auto mode's classifier? No Claude Code page says so; the connector review criteria say annotations "determine auto-permissions in Claude" for claude.ai. MCP-015.
- **Sampling:** undocumented in Claude Code and deprecated in spec 2026-07-28; issue anthropics/claude-code#1785 is still open. MCP-014.
- **Do Desktop Extensions (`.mcpb`) reach Code tab sessions?** Not documented. MCP-023.
- **Channels outside the terminal** (desktop, cloud, routines): not documented either way. MCP-027.
- **Does the action's file-based MCP config leave the secret on disk after the job?** The runner is discarded for GitHub-hosted runners; self-hosted runners weren't checked. MCP-021.
