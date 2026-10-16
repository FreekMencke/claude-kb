# Entries

Every entry by ID, title, type and tags, one table per topic file. Generated from the topic files' index tables by
`node scripts/check-kb.ts --write`: don't edit it by hand. Grep it rather than reading it whole:

```bash
grep -i -E 'webfetch|curl' ENTRIES.md
```

Then read only the entries you need: `grep -n '^## \[TOK-036\]' topics/kb-*.md` gives the file and line. Start at
[INDEX.md](INDEX.md) for Quick answers and Conflicts.

Merged entries keep their ID and a pointer, so old references still resolve.

## Visual and UI design with Claude (`topics/kb-design.md`, DESIGN)

| ID | Title | Type | Tags |
|---|---|---|---|
| DESIGN-001 | Visualising and iterating on a design in Claude Code | pattern | artifacts, design-command, variants, browser-pane |
| DESIGN-002 | Design systems for `/design`: Design System artifacts and `/design-sync` | fact | design-system, design-sync, react, angular |
| DESIGN-003 | Why Claude's designs look generic, and the named clichés by date | fact | generic, distributional-convergence, cliches |
| DESIGN-004 | Prompting for distinctive design | recommendation | prompting, brief, tokens, banned-patterns, directions |
| DESIGN-005 | The frontend-design skill and how it differs from `artifact-design` | tool | frontend-design, artifact-design, skills |
| DESIGN-006 | House style: where design tokens live and what wins | recommendation | tokens, CLAUDE.md, design-md, fonts, precedence |
| DESIGN-007 | Verify a design by measuring, not only by looking | pattern | verification, computed-styles, screenshots, contrast |
| DESIGN-008 | What Claude's vision gets wrong in design work | fact | vision, limits, coordinates, image-size |
| DESIGN-009 | Improving an existing design: inputs, audit, polish or redesign | pattern | audit, redesign, polish, accessibility, variants |
| DESIGN-010 | Extracting a design system from code or a URL | pattern | design-system, extraction, tokens, computed-styles |
| DESIGN-011 | Models and effort for design work | recommendation | models, effort, opus, sonnet, inference |
| DESIGN-012 | Community design skills (unofficial) | comparison | community, impeccable, taste-skill, design-md |
| DESIGN-013 | Design pitfalls | anti-pattern | pitfalls, verification, drift, animation, css |
| DESIGN-014 | Anthropic's other design skills in `anthropics/skills` | tool | theme-factory, canvas-design, brand-guidelines, web-artifacts-builder |
| DESIGN-015 | Colour roles: name tokens by job, not by hue | pattern | colour, roles, semantic-tokens, radix, material |
| DESIGN-016 | Generating a palette in OKLCH, to contrast targets | pattern | colour, oklch, palette, leonardo, tailwind |
| DESIGN-017 | Contrast: target WCAG 2 ratios; WCAG 3 hasn't picked an algorithm | fact | contrast, wcag, apca, accessibility |
| DESIGN-018 | Deriving dark mode | pattern | dark-mode, light-dark, colour, tokens |
| DESIGN-019 | Colour libraries Claude can call from a script or an artifact | tool | culori, colorjs, leonardo, material-color-utilities, npm |
| DESIGN-020 | Type: a fluid scale and a measured line length | pattern | typography, type-scale, utopia, line-length |
| DESIGN-021 | Token files: the DTCG format and three tiers | fact | tokens, dtcg, style-dictionary, tiers |
| DESIGN-022 | Layout: name the structure, then encode the wireframe | pattern | layout, grid, wireframes, cards, every-layout |
| DESIGN-023 | Tailwind and shadcn/ui defaults, and theming them away | fact | tailwind, shadcn, defaults, theming |
| DESIGN-024 | Coherent multi-page sites: tokens, inventory, templates, drift checks | pattern | multi-page, consistency, drift, design-system |
| DESIGN-025 | Critique and variants: diverge, pick, then score | pattern | critique, rubric, variants, heuristics |
| DESIGN-026 | Measured originality of LLM-generated UI | fact | originality, benchmark, diversity, research |
| DESIGN-027 | Test: four prompting strategies on one brief | comparison | experiment, prompting, directions, banned-patterns |
| DESIGN-028 | Isolating scripted design tests from your own setup | pattern | headless, safe-mode, isolation, testing |
| DESIGN-029 | Test: four directions, then a person picks | comparison | experiment, directions, human-pick, swatches |
| DESIGN-030 | Tests: from a visual chooser to staged picks | comparison | experiment, staged-picks, swatches, tone-of-voice |
| DESIGN-031 | Staged picks on an existing site: extract, then lock, nudge or open each step | pattern | existing-site, redesign, staged-picks, tokens |

## Repo documentation: changelogs, READMEs, decision records and drift (`topics/kb-documentation.md`, DOC)

| ID | Title | Type | Tags |
|---|---|---|---|
| DOC-001 | Keep a Changelog 2.0.0: what changed from 1.1.0 | fact | changelog, keep-a-changelog, spec |
| DOC-002 | Curate, don't accumulate: notable changes only | fact | changelog, curation, dependencies |
| DOC-003 | The brief for an LLM-drafted changelog belongs in CLAUDE.md | recommendation | changelog, claude-md, llm |
| DOC-004 | Changelogs without version numbers | fact | changelog, dates, continuous-deploy |
| DOC-005 | Common Changelog: a stricter subset | comparison | changelog, common-changelog, style |
| DOC-006 | Generated changelogs and host release notes | comparison | changelog, conventional-commits, release-please, release-notes |
| DOC-007 | How Anthropic writes its own changelogs | fact | changelog, anthropic, examples |
| DOC-008 | Enforcing changelog entries in CI | comparison | changelog, ci, github-actions, hooks |
| DOC-009 | What Anthropic's docs say about repo docs beyond CLAUDE.md | fact | readme, docs, claude-md, official |
| DOC-010 | Official skills and plugins for documentation | tool | skills, plugins, doc-coauthoring |
| DOC-011 | Decision records: Nygard, MADR and one log or many files | comparison | adr, madr, decisions |
| DOC-012 | What a README should contain | fact | readme, standard-readme, github, diataxis |
| DOC-013 | Google's rules: same change, small and fresh, delete dead docs | recommendation | freshness, drift, google |
| DOC-014 | Mechanical checks: Markdown lint, link check, Prettier, Vale | comparison | markdownlint, lychee, prettier, vale, ci |
| DOC-015 | Agents that detect or fix doc drift | pattern | drift, routines, claude-code-action, refresh-md-files |
| DOC-016 | Writing docs that agents retrieve | recommendation | retrieval, headings, agents |
| DOC-017 | Our repos' docs on 2026-10-13 | fact | our-setup, inventory, survey |
| DOC-018 | Our changelog conventions and where they deviate | comparison | our-setup, changelog, deviations |
| DOC-019 | One rule in three files drifts apart | anti-pattern | our-setup, changelog, reviewer, duplication |
| DOC-020 | Cross-file rules keep paired docs current | pattern | our-setup, reviewer, drift |
| DOC-021 | A dated decision log in one file | pattern | our-setup, decisions, adr |
| DOC-022 | Plan docs with a dated status and a delete condition | pattern | our-setup, plans, expiry |
| DOC-023 | Runbooks in `docs/` or in a skill | comparison | our-setup, runbooks, skills |
| DOC-024 | Our weekly docs-drift routine: first runs | fact | our-setup, drift, routines, refresh-md-files |

## Hooks (`topics/kb-hooks.md`, HOOK)

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

## Agents with cloud and cluster access (`topics/kb-infra-agents.md`, INFRA)

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
| INFRA-025 | `kubectl auth can-i` reads `resource/x` as a resource name, not a subresource | anti-pattern | kubernetes, rbac, kubectl, testing |
| INFRA-026 | Before changing a config value, read the code that consumes it | pattern | config, lambda, retries, issues |
| INFRA-027 | Change one Lambda environment variable without printing the others | pattern | lambda, env, credentials, transcripts |

## MCP servers: configuration, access control, surfaces and vetting (`topics/kb-mcp.md`, MCP)

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
| MCP-029 | claude.ai custom connectors: who adds them, what the server needs, limits | fact | custom-connectors, claude-ai, remote, limits |
| MCP-030 | The OAuth flow Claude runs against a connector | fact | oauth, cimd, dcr, server-authors |
| MCP-031 | How Claude treats a connector's tools: annotations, names, structured results | fact | annotations, permissions, structured-content, server-authors |
| MCP-032 | Connector quirks reported by server authors: instructions, tool lists, saved approvals | fact | instructions, tool-list, permissions, community |
| MCP-033 | Testing and debugging a custom connector | pattern | testing, inspector, troubleshooting |
| MCP-034 | How docs and knowledge-base servers shape their tools | comparison | docs-servers, search-fetch, tool-design |
| MCP-035 | Hosting a single-user remote server: Cloudflare Worker or your own server | comparison | hosting, cloudflare, fastmcp, git-sync |
| MCP-036 | Mistakes single-user remote servers made | anti-pattern | security, oauth, community |
| MCP-037 | Using a private repo's knowledge without a checkout | comparison | connectors, plugins, surfaces, no-checkout |
| MCP-038 | Chat and cloud sessions use a custom connector only when the prompt points at it | fact | connectors, claude-ai, cloud, triggering |
| MCP-039 | One server as connector and user-scope entry: names, duplicates and cost per surface | fact | connectors, scopes, tool-names, tokens |
| MCP-040 | A plugin that bundles a connector with its skill makes chat use the connector unprompted | fact | connectors, plugins, claude-ai, triggering |
| MCP-041 | A search tool beat grepping a checkout for knowledge-base lookups | fact | search, measurement, tokens, no-checkout |

## Memory and instruction files (`topics/kb-memory.md`, MEM)

| ID | Title | Type | Tags |
|---|---|---|---|
| MEM-001 | Every place instructions and memory live | comparison | locations, claude-md, rules, auto-memory |
| MEM-002 | Load order: concatenated, broad to specific, no overrides | fact | load-order, precedence, conflicts |
| MEM-003 | What loads at launch, on demand, and after compaction | fact | lazy-loading, compaction, nested |
| MEM-004 | `.claude/rules/`: unscoped, `paths:`-scoped, user-level, symlinked | fact | rules, paths, globs |
| MEM-005 | `@` imports: paths, depth and the external-import dialog | fact | imports, approval |
| MEM-006 | `CLAUDE.local.md` and personal instructions across worktrees | pattern | claude-local, worktrees, personal |
| MEM-007 | Managed policy CLAUDE.md and `claudeMd` | fact | managed, org |
| MEM-008 | AGENTS.md: when Claude Code reads it | fact | agents-md, interop |
| MEM-009 | Switches: settings and env vars that change what loads | fact | settings, env-vars, bare |
| MEM-010 | How instructions and memory are delivered to the model | fact | system-prompt, delivery, user-message |
| MEM-011 | What subagents and forks get | fact | subagents, fork, explore, omitclaudemd |
| MEM-012 | Version history of memory and instruction loading | fact | changelog, versions |
| MEM-013 | Auto memory: what gets saved and in what format | fact | auto-memory, types, frontmatter |
| MEM-014 | Auto memory recall: index at start, topic files on demand | fact | auto-memory, recall, limits |
| MEM-015 | `/memory` and auditing what was saved | tool | memory-command, audit |
| MEM-016 | Turning auto memory off or moving it | fact | auto-memory, settings, disable |
| MEM-017 | What auto memory should and shouldn't hold | recommendation | auto-memory, placement |
| MEM-018 | Stale memories | anti-pattern | staleness, maintenance |
| MEM-019 | Memory as a prompt-injection vector | fact | security, poisoning |
| MEM-020 | `/init` and `CLAUDE_CODE_NEW_INIT` | tool | init, bootstrap |
| MEM-021 | `/doctor` trim and prompt audit for instruction files | tool | doctor, audit |
| MEM-022 | The `claude-md-management` plugin | tool | plugin, audit, revise |
| MEM-023 | When to update CLAUDE.md: Anthropic's triggers | recommendation | maintenance, triggers |
| MEM-024 | Community practice for keeping instruction files current | comparison | community, maintenance, drift |
| MEM-025 | Memory ideas from other coding tools | comparison | cline, cursor, copilot, windsurf, codex |
| MEM-026 | What each surface loads | comparison | surfaces, cloud, desktop, wsl, routines, github-actions |
| MEM-027 | Worktrees and instruction files | fact | worktrees, claude-md, auto-memory |
| MEM-028 | Agent SDK and `claude -p`: setting sources and memory | fact | agent-sdk, headless, setting-sources |
| MEM-029 | Cloud Projects memory is a separate store | fact | projects, cloud, memory |
| MEM-030 | The API memory tool | tool | api, memory-tool |
| MEM-031 | API memory tool, Managed Agents memory stores and auto memory compared | comparison | api, managed-agents, auto-memory |
| MEM-032 | Community memory servers and plugins | comparison | community, mcp, mem0, claude-mem, basic-memory |
| MEM-033 | Do memory servers beat plain files? | recommendation | community, evidence, cost |
| MEM-034 | Our instruction files and memory, measured | fact | our-setup, measurement |
| MEM-035 | Our auto memory: misplaced and stale entries | comparison | our-setup, auto-memory, staleness |

## Orchestration, parallelization and model selection (`topics/kb-orchestration.md`, ORCH)

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

## Instructing the 5.x models (`topics/kb-prompting.md`, PROMPT)

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

## Agents in repositories (`topics/kb-repo-agents.md`, REPO)

| ID | Title | Type | Tags |
|---|---|---|---|
| REPO-001 | osrs-tracker-web's Claude Code setup (inventory) | fact | baseline, osrs-tracker-web |
| REPO-002 | The `conventions-reviewer` agent: definition, tools, model | fact | baseline, reviewer |
| REPO-003 | How the reviewer is triggered and how it performs (measured) | fact | baseline, measurement, cost |
| REPO-004 | What the baseline does not cover | fact | baseline, gaps |
| REPO-005 | Where each repo component lives and how it loads | fact | discovery, agents, skills, hooks, settings |
| REPO-006 | Settings precedence: scalars override, lists and hooks merge, deny wins | fact | precedence, permissions, hooks |
| REPO-007 | Workspace trust: what a repo can do before you trust it | fact | trust, hooks, security |
| REPO-008 | Commands are merged into skills | fact | commands, skills |
| REPO-009 | Agent discovery, reload and the `/agents` change | fact | discovery, reload, agents |
| REPO-010 | What a repo subagent starts with | fact | context, CLAUDE.md, skills |
| REPO-011 | Agent `memory:` for reviewers | fact | memory, reviewer |
| REPO-012 | Which surfaces load repo config | comparison | cloud, actions, add-dir, worktrees |
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
| REPO-023 | Manual triggers in a session | fact | triggers, at-mention, --agent |
| REPO-024 | Auto-delegation is advisory; make mandatory reviews deterministic | recommendation | triggers, delegation |
| REPO-025 | Hooks that force or run a review | fact | hooks, stop, agent-hooks |
| REPO-026 | Calling a repo agent from an orchestrator | recommendation | orchestrator, background, resume |
| REPO-027 | CI: `claude-code-action@v1` modes and inputs | tool | github-actions, ci |
| REPO-028 | Running repo agents and skills inside the action | fact | github-actions, skills, agents |
| REPO-029 | Managed Code Review and `REVIEW.md` | tool | code-review, review-md |
| REPO-030 | Scheduled repo agents | comparison | schedule, routines, cron |
| REPO-031 | `tools` allowlist, `disallowedTools`, and why Bash can't be scoped per agent | fact | tools, least-privilege |
| REPO-032 | The parent's permission mode overrides the agent's; auto mode checks subagents | fact | permission-modes, auto-mode |
| REPO-033 | Recipe: a reviewer that really can't write | pattern | read-only, hooks, reviewer |
| REPO-034 | Bash permission rules are pattern matches, not a boundary | fact | permissions, bash |
| REPO-035 | Sandboxing for agent Bash | tool | sandbox |
| REPO-036 | Secrets and identifiers around repo agents | recommendation | secrets, public-repo |
| REPO-037 | Prompt injection: the threat model for repo agents | fact | prompt-injection, incidents |
| REPO-038 | Hardening checklist for agents in GitHub Actions | recommendation | github-actions, security |
| REPO-039 | Untrusted-content discipline in agent prompts | pattern | prompt-injection, prompts |
| REPO-040 | Ways to share agents, skills and hooks across repos | comparison | sharing, plugins |
| REPO-041 | What a plugin can't carry for repo agents | fact | plugins, limits |
| REPO-042 | Pattern: a generic reviewer body, repo-specific rules files | pattern | sharing, rules, review-md |
| REPO-043 | Our three `conventions-reviewer` copies: one shared body since 2026-10-12 | fact | baseline, sharing |
| REPO-044 | What goes in CLAUDE.md, a skill, an agent, a hook or REVIEW.md | recommendation | CLAUDE.md, design |
| REPO-045 | Size, instruction count and cross-tool instruction files | fact | CLAUDE.md, AGENTS.md, size |
| REPO-046 | Official reviewer agents compared | comparison | reviewer, official-example |
| REPO-047 | The do-not-flag list | pattern | reviewer, noise |
| REPO-048 | Verify findings before anyone acts on them | pattern | reviewer, validation |
| REPO-049 | Severity schemes, caps and convergence | comparison | reviewer, severity |
| REPO-050 | Structured findings and a verdict line | pattern | reviewer, output |
| REPO-051 | Community agent collections: what to copy and what to avoid | anti-pattern | community, collections |
| REPO-052 | Ideas from other review tools | comparison | codex, bugbot, copilot, coderabbit |
| REPO-053 | `tools` doesn't limit the tools of an agent's own `mcpServers` server | fact | tools, mcp, least-privilege |
| REPO-054 | The v2 reviewer against the v1 baseline (measured) | fact | reviewer, measurement, noise |

## Several sessions in one repo (`topics/kb-sessions.md`, SESS)

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
| SESS-036 | Fast-forward a new worktree with a `SessionStart` hook | pattern | worktrees, hooks, sessionstart, staleness |

## Writing, testing and distributing skills (`topics/kb-skills.md`, SKILL)

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
| SKILL-011 | Descriptions: what + when, third person, user vocabulary | recommendation | description, triggering |
| SKILL-012 | Undertriggering: be a little pushy, and add negative triggers | pattern | description, triggering |
| SKILL-013 | Don't summarise a multi-step workflow in the description | pattern | description, triggering |
| SKILL-014 | Invocation controls: manual-only, hidden, path-scoped, overrides | tool | triggering, context-cost |
| SKILL-015 | Troubleshooting: not triggering, over-triggering, not followed | recommendation | triggering, debugging |
| SKILL-016 | Keep the body small: only what Claude doesn't already know | recommendation | body, size |
| SKILL-017 | Reference files: one level deep, TOC, descriptive names | pattern | progressive-disclosure |
| SKILL-018 | Scripts for deterministic steps; match freedom to fragility | pattern | scripts, body |
| SKILL-019 | Durable wording: no dates, one term per idea, a default not a menu | recommendation | body, maintenance |
| SKILL-020 | Anti-pattern: capitalised MUST/NEVER instead of reasons | anti-pattern | body, style |
| SKILL-021 | Skills vs CLAUDE.md vs hooks vs subagents vs MCP vs output styles | comparison | architecture |
| SKILL-022 | Context cost of each extension type | comparison | context-cost |
| SKILL-023 | Rules that must hold every time belong in hooks | recommendation | hooks, reliability |
| SKILL-024 | CLAUDE.md under 200 lines; move procedures into skills | recommendation | claude-md, context-cost |
| SKILL-025 | Evaluation-first development and the Claude A / Claude B loop | pattern | testing |
| SKILL-026 | `claude plugin eval`: built-in with/without evaluation | tool | testing, triggering |
| SKILL-027 | skill-creator: benchmarks and description optimisation | tool | testing, triggering |
| SKILL-028 | Designing a trigger eval set | recommendation | testing, triggering |
| SKILL-029 | Community trigger-rate numbers and forced-evaluation hooks | comparison | testing, triggering, hooks |
| SKILL-030 | `/skill-doctor`, `plugin details` and telemetry for usage and cost | tool | maintenance, context-cost |
| SKILL-031 | Anti-patterns in skill testing | anti-pattern | testing |
| SKILL-032 | Retire skills the model has outgrown | recommendation | maintenance, testing |
| SKILL-033 | Plugin layout for shipping skills | fact | distribution, plugins |
| SKILL-034 | Marketplaces and team rollout | fact | distribution, plugins |
| SKILL-035 | Plugin versioning: a fixed `version` pins users | anti-pattern | distribution, versioning |
| SKILL-036 | Auto-update, pinning and release channels | fact | distribution, versioning |
| SKILL-037 | Validate before publishing: `plugin validate --strict`, `plugin tag` | tool | distribution, ci |
| SKILL-038 | claude.ai skills: upload, sharing, org provisioning, sync into Claude Code | fact | distribution, claude.ai |
| SKILL-039 | Skills in the Claude API | fact | distribution, api |
| SKILL-040 | The Agent Skills open standard and portability | fact | portability |
| SKILL-041 | Security review of third-party skills and plugins | recommendation | security |
| SKILL-042 | anthropics/skills and claude-plugins-official | fact | collections |
| SKILL-043 | obra/superpowers: test-driven skill writing | pattern | collections, testing |
| SKILL-044 | Other strong collections: plugin-dev, Trail of Bits, wshobson, Vercel | comparison | collections |
| SKILL-045 | Anti-pattern: installing collections wholesale | anti-pattern | collections, context-cost |
| SKILL-046 | Ideas from other AI coding tools | comparison | portability, triggering |
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
| SKILL-061 | Literal `$` in a skill body: substitution and the backslash escape | fact | anatomy, commands |
| SKILL-062 | Plugins on claude.ai: Claude Code frontmatter, custom skill paths, inline servers, names and versions | fact | distribution, claude.ai, plugins, frontmatter |

## Desktop app, artifacts and remote use (`topics/kb-surfaces.md`, SURF)

| ID | Title | Type | Tags |
|---|---|---|---|
| SURF-001 | What the desktop Code tab adds over the terminal | fact | desktop, panes, diff, side-chat |
| SURF-002 | Desktop PR monitoring, auto-archive and notifications | fact | desktop, ci, pull-requests, notifications |
| SURF-003 | What the desktop Code tab lacks | fact | desktop, limitations, commands |
| SURF-004 | Desktop WSL and SSH sessions: what's missing | fact | desktop, wsl, ssh, limitations |
| SURF-005 | Desktop equivalents of CLI flags and terminal keys | fact | desktop, cli-flags, shortcuts |
| SURF-006 | Desktop Browser pane and app preview | tool | desktop, browser, preview, launch-json |
| SURF-007 | Dispatch: tasks from the phone to the desktop | tool | dispatch, mobile, desktop, cowork |
| SURF-008 | Artifacts: what they are and when to use one | recommendation | artifacts, sharing, reporting |
| SURF-009 | Artifact availability: plans, logins, surfaces, versions | fact | artifacts, availability, versions |
| SURF-010 | Artifact privacy, sharing, editors and admin controls | fact | artifacts, privacy, sharing, admin |
| SURF-011 | When Claude asks before publishing or reading an artifact | fact | artifacts, permissions, prompt-injection |
| SURF-012 | Artifact runtime capabilities: connectors and downloads | fact | artifacts, connectors, capabilities |
| SURF-013 | Artifact comments and Claude's replies | fact | artifacts, comments, review |
| SURF-014 | The artifact shared database (`ArtifactData`) | tool | artifacts, database, state |
| SURF-015 | Artifact page constraints and token cost | fact | artifacts, csp, size, cost |
| SURF-016 | Slides, Design and Docs templates, and the design skill | fact | artifacts, templates, design, docs |
| SURF-017 | Turning artifacts off per user, project or organization | fact | artifacts, settings, policy |
| SURF-018 | Remote Control: what a connected device can and can't do | fact | remote-control, mobile, commands |
| SURF-019 | Remote Control connection, reconnects and Trusted Devices | fact | remote-control, security, network |
| SURF-020 | Mobile push notifications | fact | notifications, mobile, remote-control |
| SURF-021 | The Claude mobile app as a Claude Code client | fact | mobile, cloud, remote-control |
| SURF-022 | Which desktop sessions show up on other devices | fact | desktop, remote-control, privacy |
| SURF-023 | Cloud environments: Default, variables and network secrets | fact | cloud, environments, secrets |
| SURF-024 | Cloud network access levels and what bypasses them | fact | cloud, network, allowlist |
| SURF-025 | The cloud GitHub proxy: credentials, push limits, repo scope | fact | cloud, github, proxy, gh |
| SURF-026 | Cloud setup scripts, caching and SessionStart hooks | fact | cloud, setup-script, hooks, cache |
| SURF-027 | Cloud VM image, tools and time limits | fact | cloud, vm, limits, docker |
| SURF-028 | Working inside a cloud session: commands, review, sharing | fact | cloud, commands, sharing, compaction |
| SURF-029 | Cloud auto-fix for pull requests | tool | cloud, auto-fix, ci, github |
| SURF-030 | The VS Code extension for coding work | tool | vs-code, ide, checkpoints, diagnostics |
| SURF-031 | JetBrains IDEs: the CLI with IDE integration | tool | jetbrains, ide, wsl |
| SURF-032 | Claude in Chrome for coding work | tool | chrome, browser, wsl, context-cost |
| SURF-033 | Which surface for which job | comparison | decision-table, surfaces |
| SURF-034 | Surfaces in our setup: desktop WSL and WSL terminal | comparison | our-setup, wsl, desktop |
| SURF-035 | Sending files to your device: `SendUserFile` | tool | remote-control, cloud, files, mobile |

## Token usage and context efficiency (`topics/kb-token-usage.md`, TOK)

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

## Claude for web analytics and SEO work (`topics/kb-web-analytics-seo.md`, WEB)

| ID | Title | Type | Tags |
|---|---|---|---|
| WEB-001 | osrs-tracker-web's SEO and analytics setup (2026-10-13) | fact | baseline, osrs-tracker-web, gtag |
| WEB-002 | How the 2026-10-09 SEO audit ran | fact | baseline, audit, prompt |
| WEB-003 | How the Search Console and PageSpeed data was gathered (#160) | fact | baseline, search-console, playwright |
| WEB-004 | Google credentials live outside the repo, and auto mode guards them | fact | credentials, auto-mode, our-setup |
| WEB-005 | Anti-pattern: SEO answers from memory and offers of data the session can't reach | anti-pattern | memory, hallucination, indexnow |
| WEB-006 | The official Google Analytics MCP server | tool | ga4, mcp, read-only |
| WEB-007 | Search Console: the API, its quotas, and no official MCP server | tool | search-console, api, mcp, quotas |
| WEB-008 | What the Search Console API can't give you | fact | search-console, url-inspection, ui |
| WEB-009 | GA4 Data API quotas and the BigQuery exports | fact | ga4, api, bigquery, quotas |
| WEB-010 | PageSpeed Insights needs a key; field data moves to CrUX | fact | pagespeed, crux, core-web-vitals |
| WEB-011 | Lab audits: Lighthouse CLI and Chrome DevTools MCP | tool | lighthouse, chrome-devtools-mcp, lab |
| WEB-012 | Read-only scopes and project-scoped config for Google data | recommendation | credentials, scopes, mcp-json |
| WEB-013 | Which source answers which SEO question | comparison | data-sources, search-console, ga4, logs |
| WEB-014 | Judge pages by the server HTML: curl and grep the head | pattern | curl, ssr, crawler-view, tokens |
| WEB-015 | A Playwright snapshot has no `<head>` (tested) | fact | playwright, snapshot, crawler-view |
| WEB-016 | WebFetch and the API web fetch tool are wrong for SEO checks | anti-pattern | webfetch, web-fetch-tool, claude-user |
| WEB-017 | What Google renders and indexes | fact | rendering, javascript, canonical, noindex |
| WEB-018 | Audit requests show up as bots in the server logs | fact | logs, user-agent, measurement |
| WEB-019 | Structured data has no validation API | fact | structured-data, json-ld, validator |
| WEB-020 | Anthropic's three crawlers and their robots.txt tokens | fact | crawlers, robots-txt, claude-user |
| WEB-021 | llms.txt and AI search features | fact | llms-txt, ai-overviews, geo |
| WEB-022 | Retired crawl and indexing advice models still give | anti-pattern | stale-advice, sitemaps, robots-txt |
| WEB-023 | Retired rich results, metrics and tools | anti-pattern | stale-advice, structured-data, core-web-vitals |
| WEB-024 | Universal Analytics habits in a GA4 tag | anti-pattern | ga4, gtag, stale-advice |
| WEB-025 | GA4 consent mode and data retention | fact | ga4, consent-mode, retention |
| WEB-026 | Anthropic's official SEO skills | tool | official-example, skills, seo-audit |
| WEB-027 | Community SEO skills and agents | comparison | community, skills, agents |
| WEB-028 | What a read-only SEO audit skill should do | recommendation | seo-audit, skill-design, read-only |
| WEB-029 | One audit finding: evidence, impact, effort, fix | pattern | findings, output, severity |
| WEB-030 | Let search data order the fixes | pattern | search-console, prioritising |
| WEB-031 | What our SEO sessions cost (measured) | fact | cost, measurement, opus |
| WEB-032 | A fresh sitemap's "could not be read" cleared on its own; a resubmitted index stayed pending | fact | search-console, sitemaps, sitemap-index, logs |
| WEB-033 | Google rewrote `Brand: phrase` titles whose phrase starts in lowercase | fact | title-links, titles, search-results |
| WEB-034 | A consent banner rendered after hydration became the LCP element | fact | core-web-vitals, lcp, consent, ssr |

## Session workflows (`topics/kb-workflows.md`, FLOW)

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
