<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/banner-dark.png">
  <img alt="claude-kb: using Claude efficiently, written for agents to query" src="assets/banner.png">
</picture>

<p align="center">
  <a href="https://github.com/FreekMencke/claude-kb/actions/workflows/check.yml"><img alt="KB format check" src="https://github.com/FreekMencke/claude-kb/actions/workflows/check.yml/badge.svg"></a>
  &nbsp;
  <a href="https://github.com/FreekMencke/claude-kb/actions/workflows/mcp-server.yml"><img alt="MCP server CI" src="https://github.com/FreekMencke/claude-kb/actions/workflows/mcp-server.yml/badge.svg"></a>
  &nbsp;
  <a href="https://github.com/FreekMencke/claude-kb/actions/workflows/deploy.yml"><img alt="MCP server CD" src="https://github.com/FreekMencke/claude-kb/actions/workflows/deploy.yml/badge.svg"></a>
  &nbsp;
  <a href="mcp-server/README.md"><img alt="Live server" src="https://img.shields.io/website?url=https%3A%2F%2Fclaude-kb.freekmencke.com%2Fhealthz&amp;label=live%20server&amp;up_message=online&amp;down_message=offline"></a>
</p>

A Markdown knowledge base on using Claude efficiently, written for agents to query. Every entry carries its sources, a
confidence level and a last-verified date.

## Querying it

From any repo, the `claude-kb-lookup` skill answers from this knowledge base and cites entry IDs. It reads only the
remote MCP server, `https://claude-kb.freekmencke.com/mcp`, with the tools `kb_search`, `kb_get`, `kb_quick_answers`
and `kb_status` ([mcp-server/README.md](mcp-server/README.md)); sign-in is GitHub, for the owner's account only. Reading
the server was faster than reading a checkout: 22.7 s against 32.4 s a lookup, with a third fewer tokens (MCP-041).

- **claude.ai chat (web, desktop, phone), Cowork and local Claude Code:** the `kb-lookup` plugin, the skill bundled with
  the server, so chat looks things up without being told to (MCP-040). This repo is its marketplace: on claude.ai (not
  the Code tab's Plugins page), Customize > Plugins > Add > Add marketplace, `FreekMencke/claude-kb`, with Sync
  automatically; then install `kb-lookup` and connect "Claude KB" on its Connectors tab. Claude Code loads it as
  `kb-lookup@synced` in sessions signed in with claude.ai (SKILL-059); `"kb-lookup@synced": true` in `enabledPlugins`.
- **Local Claude Code, the server itself:** also add it at user scope. It wins over the plugin's copy of the same URL
  (MCP-009), keeps the tool names `mcp__claude-kb__*` that the allow rules name, and covers desktop WSL sessions, where
  connectors are unreliable (MCP-010). It costs about 255 input tokens per request (MCP-039).

  ```bash
  claude mcp add --transport http --scope user claude-kb https://claude-kb.freekmencke.com/mcp
  ```

  ```bash
  claude mcp login claude-kb
  ```

- **Cloud sessions and routines** load neither synced plugins nor `~/.claude` (SKILL-060): start the question with
  "KB:" so Claude uses the "Claude KB" connector (MCP-038), or attach FreekMencke/claude-kb so its `.claude/skills/`
  loads.

The skill runs as a forked subagent that can't see the conversation, so pass it a self-contained question and keep its
entry IDs in the reply.

By hand: find the question in [INDEX.md](INDEX.md)'s Quick answers, or grep [ENTRIES.md](ENTRIES.md) for an ID, title
or tag, then read only that entry:

```bash
grep -n '^## \[TOK-036\]' topics/kb-*.md
```

Treat an entry last verified more than 60 days ago as a lead to re-check, not a fact.

## Layout

| Topic file | Prefix | Covers |
|---|---|---|
| [kb-orchestration.md](topics/kb-orchestration.md) | `ORCH` | Orchestration, parallel subagents, model choice |
| [kb-token-usage.md](topics/kb-token-usage.md) | `TOK` | Tokens, context, caching, research-tool cost |
| [kb-skills.md](topics/kb-skills.md) | `SKILL` | Writing, testing and distributing skills |
| [kb-repo-agents.md](topics/kb-repo-agents.md) | `REPO` | Agents in repositories |
| [kb-sessions.md](topics/kb-sessions.md) | `SESS` | Several sessions in one repo |
| [kb-hooks.md](topics/kb-hooks.md) | `HOOK` | Hooks |
| [kb-infra-agents.md](topics/kb-infra-agents.md) | `INFRA` | Agents with cloud and cluster access |
| [kb-prompting.md](topics/kb-prompting.md) | `PROMPT` | Prompting the 5.x models |
| [kb-workflows.md](topics/kb-workflows.md) | `FLOW` | Session workflows |
| [kb-memory.md](topics/kb-memory.md) | `MEM` | Memory and instruction files |
| [kb-surfaces.md](topics/kb-surfaces.md) | `SURF` | Desktop app, artifacts, cloud and remote surfaces |
| [kb-mcp.md](topics/kb-mcp.md) | `MCP` | MCP servers and connectors |
| [kb-documentation.md](topics/kb-documentation.md) | `DOC` | Repo docs Claude maintains |
| [kb-web-analytics-seo.md](topics/kb-web-analytics-seo.md) | `WEB` | Web analytics and SEO |

| Other files | What it holds |
|---|---|
| [INDEX.md](INDEX.md) | Start here: the topic files, combined Quick answers, Conflicts |
| [ENTRIES.md](ENTRIES.md) | Every entry's ID, title and tags; generated, so grep it |
| [OVERLAPS.md](OVERLAPS.md) | Overlaps kept on purpose, merges, similar-but-distinct pairs |
| [CHANGELOG.md](CHANGELOG.md) | What changed, newest first |
| [CLAUDE.md](CLAUDE.md) | Research rules and the entry format |
| [scripts/check_kb.py](scripts/check_kb.py) | Format and consistency check; `--write` regenerates ENTRIES.md |
| [.claude/skills/claude-kb-lookup/](.claude/skills/claude-kb-lookup/SKILL.md) | The lookup skill |
| [evals/claude-kb-lookup/](evals/claude-kb-lookup) | Its trigger evals |
| [.claude-plugin/](.claude-plugin/plugin.json) | The repo as the `kb-lookup` plugin (the skill plus the server) and as its own marketplace, `freek-kb`; `claude plugin eval` targets it too. No `version`, so installs follow each commit (SKILL-062) |
| [mcp-server/](mcp-server/README.md) | The remote MCP server that serves this knowledge base (see its README) |
| [assets/](assets) | Logo, and the banner in light and dark with its source (`banner.html`) |

## Changing it

Entries follow [CLAUDE.md](CLAUDE.md). When you add an entry or change its title or tags, update the topic file's
index row and run `python3 scripts/check_kb.py --write`. After any change to entries, run the check; CI runs it on
every PR and push to `main`:

```bash
python3 scripts/check_kb.py
```

### Changing the lookup skill

Edit [SKILL.md](.claude/skills/claude-kb-lookup/SKILL.md) in a PR. A new topic file goes into its description in the
same PR: the topic words there decide when it loads (SKILL-015).

After changing the description, run the trigger evals by hand (about $6 a run, so not in CI). `loads-*` cases should
load the skill, `skips-*` near misses shouldn't:

```bash
claude plugin eval . --ablation none --model claude-opus-5-5 --no-publish -j 4 --threshold 0
```

Results go to `evals/results/` (ignored). Put the before/after in the PR and replace this row:

| Cases (load + near miss) | Should load | Near miss skipped | Model | Claude Code | Date |
|---|---|---|---|---|---|
| 18 + 7 | 54/54 | 21/21 | Opus 5.5 | 2.1.296 | 2026-10-14 |

Runs are isolated per plugin, so they can't show overlap with skills in other repos.

## Monthly re-verification

A cloud routine, [claude-kb monthly re-verification](https://claude.ai/code/routines/trig_01HDV9ENf7vGtyTF52Lb4qTW),
runs at 06:00 UTC on the 1st on Sonnet 5.5. It re-checks every official-docs and official-example entry against its
sources, updates Last verified, logs corrections in CHANGELOG.md, checks new and changed entries for overlap, and opens
a PR from `claude/reverify-<YYYY-MM>`. Its prompt lives in the routine, not in this repo.

- **Reviewing it:** spot-check the removals and "unverified" marks before merging.
- **Debugging it:** RemoteTrigger `list_runs` and `get_run_log`; pause or delete it at https://claude.ai/code/routines.

<details>
<summary>Why it works this way</summary>

- **A PR, not a push to `main`:** a wrong correction to an entry every agent trusts should be reviewed first.
- **Subagents curl and grep sources for exact wording:** the first run
  ([FreekMencke/claude-kb#1](https://github.com/FreekMencke/claude-kb/pull/1)) changed 25 entries and 8 were wrong, 6 of
  them claims it couldn't find in a truncated fetch. Now a claim it can't find stays, listed as "not found"; only a
  contradicting quote changes it.
- **Overlap checks cover only new and changed entries:** the topic files were reconciled once in full
  (FreekMencke/claude-kb#28), and per-file subagents can't see other files. The lead resolves each overlap and each
  `check_kb.py` duplicate warning in OVERLAPS.md and lists them in the PR body.
- **It opens the PR with the cloud session's GitHub tool:** `gh pr create` uses GraphQL, which returns 403 in cloud
  sessions.

</details>

## Design decisions

<details>
<summary>Why the knowledge base is built this way</summary>

- **Plain Markdown in git, no memory connector or vector search.** At this size an index plus grep beats semantic
  search, files stay reviewable, and sessions carry no extra tool definitions. Revisit if lookups start failing.
- **Opus leads, Sonnet readers.** Research ran with an Opus 5.5 lead at high effort and Sonnet subagents (or a
  workflow) reading sources. Judging sources is the hard part; Haiku readers risk errors every agent inherits.
- **Only the lead writes files.** Research subagents return findings with source URLs.
- **Facts apart from recommendations.** Each topic file ends with "Recommendations for our setup" and "Open
  questions", because they're specific to our setup and go stale faster.
- **A file per kind of question, not per feature.** Prompting and memory are separate files because agents look them
  up separately; research-tool cost is a section of `kb-token-usage.md` at a handful of entries
  (FreekMencke/claude-kb#18).
- **Link, don't repeat.** Topic files link to neighbouring entries instead of covering them; overlaps kept on purpose
  are listed in OVERLAPS.md, and duplicates are merged with a pointer, never renumbered. An open question raised in two
  files lives in one. Cross-file pointers name entry IDs, not issues.
- **INDEX.md holds only what answers a lookup**, because the skill reads it whole on every question. Its Quick answers
  stay near 30 rows (each topic file keeps its own 10–15); curation records and history live in OVERLAPS.md and
  CHANGELOG.md.
- **The entry list is grepped, not read.** At 504 entries it was 51 of INDEX.md's 74 KB, so it moved to a generated
  ENTRIES.md, and the topic files to `topics/` (2026-10-13).
- **The lookup skill runs forked on Haiku** (`context: fork`), keeping the index out of the caller's context: about
  0.19 USD a lookup against 0.57 inline, with the same entries and facts (FreekMencke/claude-skills#7, 2026-10-12).
  Re-measured against the MCP server's tools on 2026-10-15 (FreekMencke/claude-kb#114): the fork calling `kb_search`
  and `kb_get` cost 0.24 USD a lookup plus one follow-up turn on Opus 5.5, against 0.35 for the main session calling
  the tools itself, and cited the expected entries in 12 of 12 runs against 10 of 12. So the fork stays (SKILL-009).
- **The lookup skill reads only the server**, never a checkout (2026-10-15): the same forked skill answered in a median
  22.7 s through `kb_search` and `kb_get` against 32.4 s fetching and grepping a checkout, with 138k against 207k Haiku
  input tokens and the same accuracy (MCP-041). It gives up unmerged entries and the index's Conflicts section.

How the knowledge base was built (each research, merge and skill step's prompts and test results) is in the git
history up to `786847b`, in the former `HANDOFF.md`.

</details>
