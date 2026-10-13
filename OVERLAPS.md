# Overlaps across topic files

How entries in different `topics/kb-*.md` files that cover the same ground were resolved: cross-linked, merged, or checked and found distinct. This is for curating the knowledge base; to answer a question, start at [INDEX.md](INDEX.md). Disagreements between entries are in INDEX.md's Conflicts, because lookups use them.

`scripts/check_kb.py` treats IDs named on one line in these sections (and in INDEX.md's Conflicts) as already reviewed together.

## Overlaps kept on purpose

These clusters cover neighbouring ground from different angles. They are cross-linked through `Related:` rather than merged:

- Where to put something, and what it costs: SKILL-021 (decision), SKILL-022 and TOK-065 (context cost), REPO-044 (repos with agents).
- CLAUDE.md size: SKILL-024 (authoring), TOK-003 (loading rules), REPO-045 (research and agents).
- Worktree staleness: SESS-006 (what `baseRef: "fresh"` fetches), SESS-036 (a `SessionStart` hook that fast-forwards), SESS-025 (rebase before pushing).
- Effort: ORCH-028 (levels and defaults), TOK-055 (as a cost lever, plus thinking), PROMPT-010 (what prompts still move once effort sets thinking).
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
- Our osrs-tracker hooks: HOOK-036 (hook details; the aws `git -C` gap, fixed in osrs-tracker/osrs-tracker-aws#79), REPO-001 (repo baseline).
- Sandboxing and credentials: REPO-035 and REPO-036 (repo agents), INFRA-011 (cloud CLIs, AWS credential masking) and INFRA-021 (transcripts, env, telemetry).
- Permission rules and their limits: REPO-034 (Bash rules are text matches), INFRA-008 (cloud CLI flag order), INFRA-006 (server flags versus credentials).
- Auto mode: REPO-032 (modes, subagents, fallback), INFRA-009 and INFRA-010 (infrastructure rules, environment entries).
- MCP servers: TOK-020 to TOK-023 (overhead and output limits), INFRA-003 to INFRA-005 and INFRA-007 (AWS, Kubernetes and Flux servers), MCP-001 to MCP-028 (configuration, access control, surfaces, vetting). The MCP file links the TOK and INFRA entries instead of moving them: their IDs are quoted elsewhere and their angle (context cost, infra credentials) belongs to those topics.
- MCP and subagents: MCP-008 (inline `mcpServers`), REPO-007 (trust for agent frontmatter), REPO-021 (browser checker).
- MCP and workspace trust: MCP-002 (`.mcp.json` approval), MCP-007 (`headersHelper`), REPO-007 (what a repo can do before trust).
- MCP per surface: MCP-021 to MCP-023 (action, cloud, desktop), REPO-028 (action config from the base branch), MEM-026 (what each surface loads), SURF-034 (our WSL surfaces).
- MCP processes per session: SESS-013 (one process set per session, measured 2026-10-13), MCP-012 (startup cost in `-p`).
- Changelogs: SESS-026 and SESS-027 (merge conflicts between parallel PRs, fragment tools), DOC-001 to DOC-008 and DOC-018 (what goes in an entry, format, enforcement, our conventions). DOC-004 links SESS-027 for continuously deployed apps instead of repeating it.
- Overviews and docs outside CLAUDE.md: MEM-021 (`/doctor` trim), MEM-033 (the arXiv context-file study), DOC-009 (where that leaves README and `docs/`).
- Rules in one place: REPO-044 (what goes in CLAUDE.md, a skill, an agent), DOC-019 (the same rule copied into three files drifts).
- Guard hooks: HOOK-028 and HOOK-032 (pattern, collections), INFRA-012 (infrastructure packs).
- Incidents: REPO-037 (prompt injection in repos and CI), INFRA-022 and INFRA-023 (destroyed infrastructure and data).
- Emphasis and reasons in instructions: SKILL-020 (skills), PROMPT-004 and PROMPT-005 (all prompts).
- CLAUDE.md wording: PROMPT-015 and PROMPT-016 (wording, conflicts), REPO-044 and REPO-045 (what goes where, size), SKILL-024.
- Subagent briefs and returns: ORCH-007 and ORCH-024 (context, decisions), PROMPT-012 and PROMPT-013 (wording), ORCH-034 and ORCH-035 (report protocol).
- Premature completion: ORCH-037 and ORCH-039 (guardrails, verifiers), PROMPT-027 (prompt lines).
- Reviewer wording: REPO-047 to REPO-049 (do-not-flag lists, validation, severity), PROMPT-032 (severity bars and recall).
- Injection: REPO-037 and REPO-039 (untrusted content), PROMPT-033 (our own harness text mistaken for injection), PROMPT-007 (marking pasted text).
- Other tools' prompts and ideas: TOK-085, ORCH-044 and REPO-052 (cost, orchestration, review), SKILL-046, MEM-025 and HOOK-034 (skills, memory, hooks), PROMPT-034 to PROMPT-036 (instruction wording).
- Community collections: SKILL-044, SKILL-045 and REPO-051 (skills, agents), PROMPT-037 (prompt wording), HOOK-032 (hooks).
- Text injected next to tool results: HOOK-007 (wording hook `additionalContext`), PROMPT-033 (harness text mistaken for injection).
- Rewind and `/btw`: TOK-033 (as context and cost tools), FLOW-016, FLOW-017 (what checkpoints keep and miss) and FLOW-032 (`/btw` for steering).
- `/clear` and recovering a session: TOK-030 (cost, handoff before clearing), FLOW-020 and FLOW-021 (signs of a stuck session, recovery ladder).
- Verification: ORCH-039 (separate reviewer), HOOK-031 (Stop-hook gates, `/goal` as a hook), PROMPT-027 and PROMPT-030 (prompt wording per model), FLOW-011 to FLOW-015 (checks inside one session, `/goal`, `/verify`, evidence).
- Scheduling and waiting: ORCH-017 (routines, desktop tasks, `/loop` compared), FLOW-024 to FLOW-028 (waiting inside a session and what polling costs).
- Model and effort: ORCH-028 and ORCH-029 (levels, escalation), FLOW-009 (for planning), FLOW-022 (to get unstuck).
- CLAUDE.md loading and size: TOK-003 (loading rules, size target), MEM-001 to MEM-005 (every location, order, lazy loading, compaction), REPO-045 (size and AGENTS.md interop), MEM-008 (AGENTS.md loading).
- Auto memory: TOK-004 (load limits), MEM-013 to MEM-018 (saving, recall, `/memory`, switches, staleness), REPO-011 (agent `memory:`).
- What a subagent starts with: ORCH-007 (everything), MEM-011 (instructions and memory only, with a contradicting probe), TOK-006 and REPO-010 (partial merges into ORCH-007; keep cache sizes and repo-agent consequences).
- Worktrees and memory: SESS-004 and SESS-009 (shared state), MEM-006 and MEM-027 (CLAUDE.local.md, instruction files per worktree).
- API memory tool: TOK-038 (context management overview), MEM-030 and MEM-031 (the tool, compared with auto memory and Managed Agents stores).
- Instruction file audits: PROMPT-017 (`/doctor prompt-audit` for wording), MEM-021 and MEM-022 (trim, stale paths, `claude-md-management`).
- Our global CLAUDE.md and repos: SESS-035, FLOW-033 and HOOK-036 (other rules), MEM-034 and MEM-035 (instruction files and auto memory).
- Surfaces and what loads: SKILL-047 and SKILL-048 (skills per surface), REPO-012 (repo config per surface), HOOK-017 (hooks per surface), MEM-026 (instruction files and memory per surface), SURF-004 and SURF-034 (desktop WSL features, our setup).
- Remote Control: SESS-020 (starting it, several sessions), SURF-018 to SURF-022 (what a device can do, connection, pushes, mobile, desktop visibility).
- Cloud sessions: ORCH-016 (overview, VM size), ORCH-017 (GraphQL block in routines), INFRA-002 (isolation for credentials), SURF-023 to SURF-029 (environments, network, GitHub proxy, setup scripts, limits, auto-fix).
- Notifications and waiting: SESS-034 (watching many sessions), HOOK-030 (Notification hooks), FLOW-024 and FLOW-029 (ways to wait, CI monitor), SURF-002 and SURF-020 (desktop CI bar and OS notifications, phone pushes), SURF-029 (cloud auto-fix).
- Browser checks: REPO-021 (browser-checker agent), SESS-013 (one browser per workspace; owns the Playwright default-profile open question), FLOW-014 (Chrome vs Playwright vs computer use, as verification), SURF-006 and SURF-032 (desktop Browser pane, Claude in Chrome), WEB-015 (a Playwright snapshot has no `<head>`, for SEO checks).
- Desktop "Auto-merge when ready": SURF-002 (the feature) and FLOW-029 (as a way to wait). Both say it squash-merges and needs repo auto-merge on; the "don't turn it on" decision is in both files' recommendations (SURF 5, FLOW 6).
- `artifact-design`: SKILL-048 (which session types list it), SURF-016 (what it is). The open question lives in `kb-surfaces.md`.
- Hooks and permission modes: HOOK-006 (a `PreToolUse` deny holds in `bypassPermissions`), INFRA-012 (infrastructure guard hooks), REPO-032 (modes).
- Remote Control approvals: SESS-020 (starting it), SURF-018 (a device answers permission prompts; never Bypass mode).
- Research subagents: PROMPT-012 and PROMPT-013 (any subagent's brief and return format), ORCH-020 and ORCH-025 (multipliers, scaling rules), TOK-099 to TOK-101 (what research adds: source order, curl rule, sources back, the shared search budget). ORCH-030 puts codebase search on Haiku; TOK-099 keeps research readers on Sonnet because they judge sources, not because the advice differs.
- MCP output and docs servers: TOK-023 (output limits), TOK-088 (WebFetch results saved to a file), TOK-095 to TOK-097 (docs MCP servers), INFRA-003 (the AWS server, which TOK-097 lists for its docs tools).
- Raw pages instead of WebFetch: TOK-087 and TOK-089 (reading docs for research), WEB-016 and WEB-014 (inspecting the page under test in an SEO audit).
- llms.txt: TOK-090 (reading Anthropic's to find docs), WEB-021 (publishing one, and what Google and Anthropic say it does for search).
- The credential is the control: INFRA-006 (AWS and Kubernetes), WEB-012 (Google read-only scopes).
- Report formats: REPO-049 and REPO-050 (reviewer severity and findings), WEB-029 (audit findings ranked by impact and effort).

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

## Similar but distinct

`scripts/check_kb.py` warns about entries in different files with very similar titles or mostly shared tags. These pairs were checked and cover different things; listing a pair here (or together on one Overlaps or Merges line) silences the warning.

- HOOK-020 and TOK-064: hooks declared in skill and agent frontmatter, against frontmatter fields that make a skill cheaper to load.
- MCP-008 and TOK-035: scoping an MCP server to one subagent, against delegating verbose work to a subagent in general.
- MCP-021 and REPO-027: MCP servers in the action, against the action's modes and inputs.
- MEM-031 and ORCH-018: memory stores in the API and Managed Agents, against Managed Agents' multi-agent setup.
- REPO-034 and FLOW-006: what Bash permission rules can match, against what plan mode blocks.
- SESS-018 and SKILL-010: a message from another session grants nothing, against `allowed-tools` pre-approving without restricting.
- REPO-001 and WEB-001: osrs-tracker-web's Claude Code setup (agents, hooks, skills), against its SEO and analytics code.
- WEB-022 and WEB-033: retired title-length advice, against how Google rewrites a `Brand: phrase` title.
