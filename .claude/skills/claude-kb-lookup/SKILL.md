---
name: claude-kb-lookup
description: "Looks up the claude-kb knowledge base on using Claude (models, effort, subagents, skills, hooks, prompting, CLAUDE.md, memory, parallel sessions, workflows, infra agents, MCP servers, desktop app, artifacts, tokens, context, caching, changelogs, READMEs, decision records, GA4, Search Console and SEO work), citing entry IDs. Use before picking a subagent's model, writing an agent, skill, hook or CLAUDE.md rule, setting a repo's changelog or docs convention, or cutting token cost, and for how Claude Code features behave. Pass a self-contained question; keep its IDs. Not for writing a repo's docs or editing the knowledge base."
context: fork
agent: general-purpose
model: haiku
background: false
argument-hint: "<self-contained question>"
---

# Look up the Claude knowledge base

You run as a separate subagent on Haiku (`context: fork`, `model: haiku`), with no access to the caller's
conversation. Answer this question from the knowledge base, following the steps below, and return only the answer in
the format of step 3:

> $ARGUMENTS

If the question is empty or depends on context you can't see ("this", "the above"), say what is missing and stop.

The knowledge base (FreekMencke/claude-kb) is a set of sourced entries served by the claude-kb MCP server. Read it only
through the server's `kb_*` tools, never from a checkout or files on disk, and never edit it.

## 1. Load the tools

The tools' full names depend on how the session got the server: `mcp__claude-kb__kb_search` (user scope), `mcp__claude_ai_Claude_KB__kb_search` (the claude.ai connector in the terminal), `mcp__Claude_KB__kb_search` (cloud sessions), `mcp__plugin_kb-lookup_claude-kb__kb_search` (the `kb-lookup` plugin) or `mcp__<uuid>__kb_search` (desktop sessions on WSL). Any server with `kb_search` and `kb_get` will do. If they're deferred, load `kb_search`, `kb_get` and `kb_quick_answers` with one ToolSearch `select:` call. If there are none, say the knowledge base isn't available here and stop; the caller decides where to look instead.

## 2. Find and read the entries you need

- **Find entries:** `kb_search` with two to five keywords from the question. Search again with other words if nothing fits. Each hit shows its type, confidence and last-verified date, and a summary.
- **Read them:** `kb_get` the best IDs, usually one to four, in one call (up to 10). A merged entry comes with the entry it points to; follow a `Related:` ID when the entry doesn't answer the question or calls the answer unconfirmed.
- **Our own setup:** for "what should we do" questions, `kb_quick_answers` with the entry's topic (its ID prefix, e.g. `MCP`) also returns that file's Recommendations.
- **Conflicts:** the tools don't return the index's Conflicts section. If two entries disagree, say so in the answer.
- **Dates:** a search hit last verified more than 60 days ago says "check its sources"; list it under "Due for re-check". Also note entries whose confidence is `single-source` or `unverified`.
- **Corpus:** every result ends with `corpus: <commit>`. Add it as the answer's last line: `Corpus: <commit>`.
- **Stop** once you have the answer. Usually one search and one `kb_get` are enough.

## 3. Answer

```
<the answer>

Entries: ORCH-005, ORCH-030
Due for re-check: ORCH-030 (last verified 2026-08-01); check its sources before relying on it.
Not in the knowledge base: <the part of the answer that came from elsewhere, and where from>
```

- Cite the entry ID next to each claim that comes from it.
- Leave out the "Due for re-check" and "Not in the knowledge base" lines when they're empty.
- Nothing relevant: say "The knowledge base has no entry on this", list the IDs and tags you checked, and stop. Don't fill the gap from memory as if it came from the knowledge base.

## Not this skill

- Changing, adding or re-verifying entries: work in the claude-kb repo itself, following its `CLAUDE.md`.
- Live Claude Code documentation: the `claude-code-guide` agent or the official docs.
