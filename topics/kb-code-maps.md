# Codebase maps and knowledge graphs for agents

Prefix `CODEMAP`. This file covers tools that pre-build a map of a codebase for a coding agent: Graphify and Understand-Anything (knowledge graphs, both installed as Claude Code skills or plugins with hooks), Repomix (one packed file) and Serena (language-server tools over MCP). It records how each builds its map and what that costs, what it injects into Claude's context, its licence and privacy notes, the evidence that a map beats plain search, and when one is worth trying. It links rather than repeats: Claude Code's own search without an index (RETR-002, RETR-003, TOK-041), how other coding tools retrieve context (RETR-013), code-index MCP servers (TOK-084), GraphRAG (RETR-015) and the knowledge-base-as-compiled-layer view (RETR-001).

Research basis:
- Researched 2026-10-30 in a cloud session, Claude Code v2.1.314, Opus 5.5 lead with a Sonnet reader on the READMEs.
- The lead shallow-cloned each repo and read it locally; nothing was installed or run. Commits: Graphify-Labs/graphify `0a8cd4e` (branch `v8`, 2026-10-27), Egonex-AI/Understand-Anything `4e6d329` (2026-10-26, plugin 2.9.8), yamadashy/repomix `7d7b28b` (2026-10-29) and oraios/serena `ede329a` (2026-10-28).
- Versions from the registries: PyPI `graphifyy` 0.9.97 (uploaded 2026-10-27, `curl https://pypi.org/pypi/graphifyy/json`), PyPI `serena-agent` 2.1.0 (2026-10-19), npm `repomix` 1.18.1 (`npm view repomix 'time[1.18.1]'`: 2026-09-21).
- Stars are from GitHub repository search on 2026-10-30. They are popularity signals that can be gamed; nothing here rests on them.
- Nothing was tested: the research rules exclude running community code, so every figure about cost or benefit is the vendor's own.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Which codebase-map tools are popular, and how do they differ? | Graphify (138,954 stars): a tree-sitter graph with query commands and hooks. Understand-Anything (88,960): an LLM-built graph plus dashboard. Repomix (29,078): the repo packed into one file. Serena (30,865): language-server symbol tools over MCP. | CODEMAP-001 |
| Does building a Graphify graph cost tokens? | Not for code: tree-sitter, "Nothing leaves your machine". Docs, PDFs and images go through your session's model or an API key. | CODEMAP-002 |
| Does Graphify change how Claude searches? | Yes. `graphify claude install` adds `PreToolUse` hooks on `Bash|Grep` and `Read|Glob` that inject a nudge toward `graphify query`; strict mode denies the first raw read per session. | CODEMAP-003 |
| Does a graph beat grep? | One vendor result: Graphify lifted key-fact coverage from 70.8% to 82.0% on 6 questions about a 1M-line repo, at about 140k tokens per query. No independent test of any tool. | CODEMAP-004 |
| Does Graphify send telemetry or my code anywhere? | "No telemetry"; code stays local. Docs, PDFs and images go to your session's model, or headless to whichever provider's API key is set first. Every query is logged to `~/.cache/graphify-queries.log` (`GRAPHIFY_QUERY_LOG_DISABLE=1`). | CODEMAP-002 |
| What does Understand-Anything cost? | An LLM multi-agent pipeline over the whole codebase that "can consume a significant number of tokens on large projects"; no figures. Later runs are incremental. | CODEMAP-005 |
| Is Understand-Anything safe to install? | Read it first: its `SessionStart` hook tells Claude to run a prompt file and "Do not ask the user for confirmation — just do it", and its quick install is `curl … | bash`. | CODEMAP-006 |
| Is Repomix a map? | No: it packs files into one output, optionally `--compress`ed by tree-sitter to signatures, with Secretlint excluding detected secrets. For handing a repo to a chat, not for an agent with grep. | CODEMAP-007 |
| What licence is Serena? | The app is GPL-3.0-or-later and its SolidLSP library MIT, so the `serena-agent` package as a whole is GPL-3.0-or-later. | CODEMAP-008 |
| Should we add a codebase map? | No, at our repo sizes. Claude Code's search and an LSP plugin already cover it; test a map on a large unfamiliar repo before trusting it. | CODEMAP-009 |
| How do I trial a map without changing how Claude searches? | Graphify `--code-only` without `graphify claude install` (so no hooks); ask the same structural questions with and without `graphify query` and compare answers and tokens. | CODEMAP-009 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| CODEMAP-001 | Four codebase-map tools compared | comparison | graphify, understand-anything, repomix, serena, community |
| CODEMAP-002 | Graphify: how it builds the graph, privacy and the embedder contradiction | fact | graphify, tree-sitter, privacy, cost |
| CODEMAP-003 | Graphify's hooks steer Claude from grep to the graph | fact | graphify, hooks, pretooluse, search |
| CODEMAP-004 | Graphify's benchmark: 6 questions, vendor-run | fact | graphify, measurement, grep |
| CODEMAP-005 | Understand-Anything: an LLM-built graph and its token cost | fact | understand-anything, cost, agents |
| CODEMAP-006 | Understand-Anything's hooks and install: a vetting case | anti-pattern | understand-anything, hooks, security, vetting |
| CODEMAP-007 | Repomix: a packed file, not a map | tool | repomix, packing, tree-sitter, secretlint |
| CODEMAP-008 | Serena 2.1.0: licence and what it adds over the LSP plugin | fact | serena, lsp, mcp, licence |
| CODEMAP-009 | When a codebase map is worth trying | recommendation | adoption, search, grep, lsp |

## [CODEMAP-001] Four codebase-map tools compared
- Type: comparison
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-30
- Sources: [Graphify-Labs/graphify](https://github.com/Graphify-Labs/graphify/tree/0a8cd4e), [Egonex-AI/Understand-Anything](https://github.com/Egonex-AI/Understand-Anything/tree/4e6d329), [yamadashy/repomix](https://github.com/yamadashy/repomix/tree/7d7b28b), [oraios/serena](https://github.com/oraios/serena/tree/ede329a)
- Related: CODEMAP-009, RETR-013, TOK-084, RETR-015

Stars from GitHub search on 2026-10-30.

| Tool | Stars | Licence | Map | Built by | Gets into Claude through |
|---|--:|---|---|---|---|
| Graphify 0.9.97 | 138,954 | Apache-2.0 (plus a `LICENSE-MIT` file) | Graph of code, docs and media; `GRAPH_REPORT.md`; HTML export | tree-sitter for code; an LLM for docs, PDFs, images | A skill, `.claude/CLAUDE.md` registration, `PreToolUse` hooks, an MCP query tool |
| Understand-Anything 2.9.8 | 88,960 | MIT | `.ua/knowledge-graph.json` with summaries, layers, tours; a dashboard | "Tree-sitter + LLM hybrid", 10 agent definitions | A plugin with skills and `SessionStart`/`PostToolUse` hooks |
| Repomix 1.18.1 | 29,078 | MIT | None: one packed file | File concatenation, optional tree-sitter compression | You paste or attach the file, or its MCP server |
| Serena 2.1.0 | 30,865 | GPL-3.0-or-later (SolidLSP MIT) | None: live symbol queries | Language servers | MCP tools |

Only the first two build a persistent map. They differ in the expensive step: Graphify parses code deterministically, Understand-Anything has agents read and summarise it.

## [CODEMAP-002] Graphify: how it builds the graph, privacy and the embedder contradiction
- Type: fact
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-30
- Sources: [graphify README](https://github.com/Graphify-Labs/graphify/blob/0a8cd4e/README.md), [graphify BENCHMARKS.md](https://github.com/Graphify-Labs/graphify/blob/0a8cd4e/BENCHMARKS.md)
- Related: CODEMAP-003, CODEMAP-004, RETR-015

From the README at `0a8cd4e`:

- **Code:** "processed locally via tree-sitter. Nothing leaves your machine. A code-only corpus requires no API key"; `--code-only` skips the rest.
- **Docs, PDFs, images:** "sent to your AI assistant for semantic extraction (via the `/graphify` skill, using whatever model your IDE session runs)". Headless `graphify extract` needs an API key and picks the provider from whichever key is set ("priority: Gemini → Kimi → Claude → OpenAI → DeepSeek → Azure → Bedrock → Ollama"), printing which one it chose. Pass `--backend` to choose; on a mixed repo with several keys set, the auto-pick may send docs somewhere you didn't intend.
- **Privacy:** "No telemetry, no usage tracking, no analytics." Every query is logged to `~/.cache/graphify-queries.log` (question, corpus, nodes returned, duration); `GRAPHIFY_QUERY_LOG_DISABLE=1` opts out.
- **Freshness:** `graphify hook install` adds git hooks that rebuild "on commit + branch checkout".

**Contradiction:** the README says "No embeddings, no vector store: a real graph you traverse", while BENCHMARKS.md says graphify "extracts with tree-sitter … and a local embedder" and names "BGE-m3". Which is true by default wasn't settled from the docs; check the code before relying on "no embeddings".

## [CODEMAP-003] Graphify's hooks steer Claude from grep to the graph
- Type: fact
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-30
- Sources: [graphify install.py](https://github.com/Graphify-Labs/graphify/blob/0a8cd4e/graphify/install.py), [graphify cli.py `_run_hook_guard`](https://github.com/Graphify-Labs/graphify/blob/0a8cd4e/graphify/cli.py), [graphify README: always-on](https://github.com/Graphify-Labs/graphify/blob/0a8cd4e/README.md)
- Related: HOOK-006, HOOK-007, TOK-041, SKILL-069

`graphify claude install` writes a skill registration into `.claude/CLAUDE.md` and two `PreToolUse` hooks (read in `install.py`, not run):

- `"matcher": "Bash|Grep"` runs `graphify hook-guard search`; `"matcher": "Read|Glob"` runs `graphify hook-guard read`; each with `"timeout": 10`, because unset "Claude Code defaults a command hook to 600s".
- When a graph exists, the guard returns `additionalContext` nudging Claude "to use graphify instead of grepping/reading raw files". It fails open: "any error, or a non-matching tool call, prints nothing".
- **Strict mode** (`--strict` or `GRAPHIFY_HOOK_STRICT`): "the FIRST raw read of indexed, in-project, fresh code per session is DENIED with a redirect to `graphify query` (permissionDecision)", then it falls back to the nudge.
- A `--project` install writes the bare `graphify` command, "since that config gets committed": everyone who clones then runs whatever `graphify` is on their PATH.

Cost: one Python process per Bash, Grep, Read and Glob call ("~170ms warm"), plus the nudge text in context each time a search matches (HOOK-007). This is the mechanism to weigh, more than the graph: it overrides Claude Code's search-first default (TOK-041) on every repo where a graph exists.

## [CODEMAP-004] Graphify's benchmark: 6 questions, vendor-run
- Type: fact
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-30
- Sources: [graphify BENCHMARKS.md](https://github.com/Graphify-Labs/graphify/blob/0a8cd4e/BENCHMARKS.md)
- Related: CODEMAP-002, CODEMAP-009, TOK-084, RETR-010

The only head-to-head against grep among these tools. BENCHMARKS.md, "Last updated: 2026-07-05":

- Setup: "a fixed coding agent (Claude Opus 4.8, at most 14" turns), on ERPNext, "a roughly 1M-LOC production repo".
- Result: "giving a fixed coding agent one graphify tool lifts key-fact coverage across the graded question set (n=6) from 70.8% (a grep and read baseline) to 82.0%, at about 140K tokens per query".

Limits:
- Six questions; no spread or repeat runs reported in that line.
- Key-fact coverage on questions, not task success or code changes.
- 140k tokens per query is not compared with the baseline's tokens.
- Opus 4.8 is an earlier model than the 5.x line; current Claude Code search may differ.
- The vendor wrote the questions, the harness and the grading.

The other benchmark rows (LOCOMO, LongMemEval) are memory retrieval, not code. Understand-Anything, Repomix and Serena publish no measurement against plain search; TOK-084 records claude-context's vendor-run 39% token figure.

## [CODEMAP-005] Understand-Anything: an LLM-built graph and its token cost
- Type: fact
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-30
- Sources: [Understand-Anything README](https://github.com/Egonex-AI/Understand-Anything/blob/4e6d329/README.md), [plugin agents](https://github.com/Egonex-AI/Understand-Anything/tree/4e6d329/understand-anything-plugin/agents)
- Related: CODEMAP-006, CODEMAP-001, RETR-001

- **Build:** "A multi-agent pipeline scans your project, extracts every file, function, class, and dependency, then builds a knowledge graph saved to `.ua/knowledge-graph.json`." The plugin defines 10 agents (project-scanner, file-analyzer, architecture-analyzer, domain-analyzer, tour-builder, graph-reviewer and others).
- **Cost:** "The initial `/understand` analyzes your whole codebase and can consume a significant number of tokens on large projects. We recommend running it on a token plan / subscription". No figures are given.
- **Updates:** incremental after a commit. Its update prompt's cost rule: deletion-only, ignored-only, generated-only and cosmetic-only changes "dispatch no LLM agent".
- **Sharing:** "The graph is just JSON — **commit it once, and teammates skip the pipeline**"; commit `.ua/` except `intermediate/` and `diff-overlay.json`. The dashboard runs from Node alone and prints "a tokenized URL (`http://127.0.0.1:5173/?token=…`)".

Unlike Graphify, every node summary is model-written, so the map can be wrong in ways a parser's can't, and a committed graph goes stale between updates. It gives people an onboarding view; nothing shows it helps the agent's own coding.

## [CODEMAP-006] Understand-Anything's hooks and install: a vetting case
- Type: anti-pattern
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-30
- Sources: [hooks.json](https://github.com/Egonex-AI/Understand-Anything/blob/4e6d329/understand-anything-plugin/hooks/hooks.json), [auto-update-prompt.md](https://github.com/Egonex-AI/Understand-Anything/blob/4e6d329/understand-anything-plugin/hooks/auto-update-prompt.md), [README install](https://github.com/Egonex-AI/Understand-Anything/blob/4e6d329/README.md)
- Related: SKILL-069, SKILL-041, HOOK-008, PROMPT-004

What SKILL-069's checklist would flag:

- **A hook that orders unattended work.** The `SessionStart` hook, when `autoUpdate` is on and the graph's commit differs from `HEAD`, prints: "Knowledge graph is stale. You MUST read the file at ${CLAUDE_PLUGIN_ROOT}/hooks/auto-update-prompt.md and execute its instructions to check for structural changes and update the graph. Do not ask the user for confirmation — just do it." That prompt runs Node helpers and may dispatch LLM agents, at the start of a session about something else. Instructions that bypass confirmation are item 6.
- **A `PostToolUse` hook on every Bash call** runs a Node script.
- **Pipe-to-shell install:** `curl -fsSL https://raw.githubusercontent.com/Egonex-AI/Understand-Anything/main/install.sh | bash` runs `main` unpinned. The marketplace route (`/plugin marketplace add Egonex-AI/Understand-Anything`) at least shows what is installed.
- **Committed data read back into context:** a teammate's committed graph is text the agent later reads (item 9).

The pattern to avoid in our own plugins: a hook that tells the model to act without asking. Put the action behind a command the user runs, or say what will happen and ask.

## [CODEMAP-007] Repomix: a packed file, not a map
- Type: tool
- Applies to: Claude Code, claude.ai
- Confidence: official-example
- Last verified: 2026-10-30
- Sources: [repomix README](https://github.com/yamadashy/repomix/blob/7d7b28b/README.md)
- Related: CODEMAP-001, TOK-041, RETR-001

Repomix (npm `repomix` 1.18.1, MIT) "packs your entire repository into a single, AI-friendly file". It's for giving a whole repo to a model without file tools (a claude.ai chat, a Project, another vendor's chat), not for Claude Code, which reads files itself.

- `--compress` "uses Tree-sitter to extract key code elements"; the config docs say it "Reduces token usage by ~70%" (vendor figure). `output.patterns` sets the level per glob.
- `--token-budget <number>`: "Fail with a non-zero exit code when the packed output exceeds N tokens".
- Secretlint leaves out "files matching known credential formats". That is a heuristic, not a guarantee: check the output before sharing it.
- `--remote` packs a GitHub repo; its config files "are not loaded by default. This prevents untrusted repositories from executing code via config files" (`--remote-trust-config` to opt in).

For a claude.ai Project, a compressed pack is one way to fit a repo into project knowledge; for Claude Code it duplicates what grep and Read do on demand.

## [CODEMAP-008] Serena 2.1.0: licence and what it adds over the LSP plugin
- Type: fact
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-30
- Sources: [serena LICENSE](https://github.com/oraios/serena/blob/ede329a/LICENSE), [serena README](https://github.com/oraios/serena/blob/ede329a/README.md), [serena-agent on PyPI](https://pypi.org/project/serena-agent/)
- Related: TOK-084, TOK-041, OSS-001

TOK-084 covers Serena's tools; this adds its version and licence. PyPI `serena-agent` 2.1.0 was uploaded 2026-10-19.

**Licence**, from the LICENSE file ("Serena Licensing Overview"): "SolidLSP under the MIT License and the Serena application under GPL-3.0-or-later". "Because MIT is compatible with the GPL, any distribution that combines both - such as the `serena-agent` package - is as a whole subject to the terms of GPL-3.0-or-later." Running it as an MCP server imposes nothing on your code; copying or redistributing Serena's code does.

**Over Claude Code's own LSP:** Claude Code's costs page already recommends code-intelligence (LSP) plugins, where "go to definition" replaces "a grep followed by reading multiple candidate files" (TOK-041). Serena adds symbol-level editing tools and more languages, and says its tools are "much more token-efficient than typical alternatives", with no figure. For a TypeScript-only stack the plugin covers the main need.

## [CODEMAP-009] When a codebase map is worth trying
- Type: recommendation
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-30
- Sources: [graphify BENCHMARKS.md](https://github.com/Graphify-Labs/graphify/blob/0a8cd4e/BENCHMARKS.md), [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- Related: CODEMAP-003, CODEMAP-004, CODEMAP-006, RETR-002, RETR-013, TOK-041

Our judgement from the entries above.

**Don't add one to repos of our size.** Claude Code finds code by searching on demand (RETR-002), Anthropic's context guidance favours that "just-in-time" approach (TOK-041), and the only published gain for a map is 6 questions on a 1M-line repo (CODEMAP-004). Graphify's hooks would also override that default on every search.

**Worth a trial when:**
- the repo is large and unfamiliar (hundreds of thousands of lines, several languages), and the questions are about structure ("what calls this across services?") rather than one symbol;
- a person wants an onboarding view (Understand-Anything's dashboard, Graphify's HTML export), separate from what the agent uses.

**How to trial:** Graphify with `--code-only` (no LLM, no keys), without `graphify claude install`, so no hooks; ask the same structural questions with and without `graphify query`, and compare answers and tokens per question. Install the hooks only if that wins. Understand-Anything: only through the marketplace, with `autoUpdate` off (CODEMAP-006).

## Recommendations for our setup

Ranked by impact against effort.

1. Decision: **no codebase-map tool in our repos** (CODEMAP-009). Revisit for a repo over about 200k lines, or if an independent test shows a gain on coding tasks.
2. **Add the "hook tells the model not to ask" case to SKILL-069's item 6** as an example (CODEMAP-006): a one-line edit in `kb-skills.md`.
3. **Use Repomix `--compress` only to hand a repo to a claude.ai chat or Project** (CODEMAP-007), checking the output for secrets first.

## Open questions

- **Does Graphify use an embedder by default?** Its README says no embeddings; BENCHMARKS.md names a local BGE-m3 embedder (CODEMAP-002). The code wasn't traced.
- **Understand-Anything's tokens per build:** no figure published; a run on a known repo would give one (CODEMAP-005).
- **An independent map-against-grep test on Claude Code:** none found for any tool (CODEMAP-004).
- **Repomix and Serena telemetry:** a README search found nothing; their code wasn't grepped.
