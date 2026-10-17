<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/banner-dark.png">
    <img alt="claude-kb: using Claude efficiently, written for agents to query" src="assets/banner.png">
  </picture>
</p>

<p align="center">
  <a href="https://github.com/FreekMencke/claude-kb/actions/workflows/check.yml"><img alt="KB format check" src="https://github.com/FreekMencke/claude-kb/actions/workflows/check.yml/badge.svg"></a>
  &nbsp;
  <a href="https://github.com/FreekMencke/claude-kb/actions/workflows/mcp-server.yml"><img alt="MCP server CI" src="https://github.com/FreekMencke/claude-kb/actions/workflows/mcp-server.yml/badge.svg"></a>
  &nbsp;
  <a href="https://github.com/FreekMencke/claude-kb/actions/workflows/deploy.yml"><img alt="MCP server CD" src="https://github.com/FreekMencke/claude-kb/actions/workflows/deploy.yml/badge.svg"></a>
  &nbsp;
  <a href="mcp-server/README.md"><img alt="Live server" src="https://img.shields.io/website?url=https%3A%2F%2Fclaude-kb.freekmencke.com%2Fhealthz&amp;label=live%20server&amp;up_message=online&amp;down_message=offline"></a>
</p>

A Markdown knowledge base on using Claude efficiently, and on the stack it works on (Angular, TypeScript, Node, npm,
GitHub Actions, fonts, CSS, accessibility), written for agents to query. Every entry carries its sources, a confidence
level and a last-verified date.

## Setup

Claude reads the knowledge base through the `claude-kb-lookup` skill and the remote MCP server at
`https://claude-kb.freekmencke.com/mcp` ([mcp-server/README.md](mcp-server/README.md)), which is open to anyone
without a sign-in. The files can also be read [by hand](#by-hand).

| Where you ask | What to set up |
|---|---|
| claude.ai chat (web, desktop, phone), Cowork | [The plugin](#the-plugin) |
| Claude Code on your machine, desktop WSL included | [The plugin](#the-plugin), installed [from the command line](#in-claude-code) |
| Cloud sessions and routines | Nothing to install: [prefix the question](#cloud-sessions-and-routines) |

### The plugin

The `kb-lookup` plugin bundles the skill with the server, so chat looks things up without being told to (MCP-040).
This repo is its marketplace.

#### On claude.ai

For chat and Cowork:

1. On claude.ai (not the Code tab's Plugins page): Customize > Plugins > Add > Add marketplace.
2. Enter `FreekMencke/claude-kb` and turn on Sync automatically.
3. Install `kb-lookup`, then connect "Claude KB" on its Connectors tab.

Claude Code sessions signed in with claude.ai get it as `kb-lookup@synced` (SKILL-059), but desktop WSL sessions
didn't load that copy in a 2026-10-17 test (SKILL-063).

#### In Claude Code

Install it from the command line as well:

```bash
claude plugin marketplace add FreekMencke/claude-kb
```

```bash
claude plugin install kb-lookup@freek-kb
```

- The CLI names the marketplace `freek-kb`, the `name` in `.claude-plugin/marketplace.json`. `kb-lookup@claude-kb`,
  the name the claude.ai sync uses, fails.
- Auto-update is off for this marketplace (SKILL-036). Turn it on in `/plugin` > Marketplaces, or with
  `"autoUpdate": true` on the `freek-kb` entry of `extraKnownMarketplaces` in `~/.claude/settings.json`.
- This copy wins over `kb-lookup@synced`, so the skill is listed once.
- Its tools are named `mcp__plugin_kb-lookup_claude-kb__*` (MCP-009): allow that pattern in `permissions.allow`.

### The server at user scope

Optional, for the tools without the plugin's skill. The plugin's own server works in desktop WSL sessions too
(SKILL-063).

```bash
claude mcp add --transport http --scope user claude-kb https://claude-kb.freekmencke.com/mcp
```

- It wins over the plugin's copy of the same URL (MCP-009), so with both installed the tools are named
  `mcp__claude-kb__*`.
- It works in desktop WSL sessions, where claude.ai connectors are unreliable (MCP-010).
- It costs about 255 input tokens per request (MCP-039).

### Cloud sessions and routines

These load neither synced plugins nor `~/.claude` (SKILL-060). Either start the question with "KB:" so Claude uses the
"Claude KB" connector (MCP-038), or attach the FreekMencke/claude-kb repo so its `.claude/skills/` loads.

## Querying it

Ask the `claude-kb-lookup` skill, or in a cloud session start the question with "KB:". The skill runs as a forked
subagent that can't see your conversation, so give it a self-contained question, and keep the entry IDs it cites in
your reply.

Treat an entry last verified more than 60 days ago as a lead to re-check, not a fact.

### By hand

Find the question in [INDEX.md](INDEX.md)'s Quick answers, or grep [ENTRIES.md](ENTRIES.md) for an ID, title or tag.
Then read only that entry:

```bash
grep -n '^## \[TOK-036\]' topics/kb-*.md
```

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
| [kb-design.md](topics/kb-design.md) | `DESIGN` | Visual and UI design with Claude |
| [kb-typescript.md](topics/kb-typescript.md) | `TS` | TypeScript 6.0 to 7.0 |
| [kb-nodejs.md](topics/kb-nodejs.md) | `NODE` | Node.js 24/26 runtime and the modern JS baseline |
| [kb-angular.md](topics/kb-angular.md) | `NG` | Angular 21–22 changes and Angular's AI tooling |
| [kb-js-upgrades.md](topics/kb-js-upgrades.md) | `JSUP` | Dependency upgrades and codemods in Node/TS repos |
| [kb-npm.md](topics/kb-npm.md) | `NPM` | npm 12, packages and publishing |
| [kb-github-actions.md](topics/kb-github-actions.md) | `GHA` | GitHub Actions: changes and hardening |
| [kb-js-testing.md](topics/kb-js-testing.md) | `JSTEST` | Testing Node/TS code, and tests written by agents |
| [kb-css-baseline.md](topics/kb-css-baseline.md) | `CSS` | Modern CSS and Baseline browser support |

| Other files | What it holds |
|---|---|
| [INDEX.md](INDEX.md) | Start here: the topic files, combined Quick answers, Conflicts |
| [ENTRIES.md](ENTRIES.md) | Every entry's ID, title and tags; generated, so grep it |
| [OVERLAPS.md](OVERLAPS.md) | Overlaps kept on purpose, merges, similar-but-distinct pairs |
| [CHANGELOG.md](CHANGELOG.md) | What changed, newest first |
| [CLAUDE.md](CLAUDE.md) | This knowledge base's research rules on top of the `research` skill, and the entry format |
| [scripts/check-kb.ts](scripts/check-kb.ts) | Format and consistency check; `--write` regenerates ENTRIES.md. Node 22.18 or later runs it as is, so cloud sessions' Node 22 does too (SURF-027) |
| [.claude/skills/claude-kb-lookup/](.claude/skills/claude-kb-lookup/SKILL.md) | The lookup skill |
| [evals/claude-kb-lookup/](evals/claude-kb-lookup) | Its trigger evals |
| [.claude-plugin/](.claude-plugin/plugin.json) | The `kb-lookup` plugin (the skill plus the server) and its marketplace, `freek-kb`. No `version`, so installs follow each commit (SKILL-062) |
| [mcp-server/](mcp-server/README.md) | The remote MCP server that serves this knowledge base |
| [assets/](assets) | Logo, and the banner in light and dark with its source (`banner.html`) |
| [LICENSE](LICENSE), [LICENSE-MIT](LICENSE-MIT) | CC BY-NC 4.0 for the knowledge base, MIT for the code (see License) |

## Changing it

Research sessions run the `research` skill from the `freek-skills` plugin
([FreekMencke/claude-skills](https://github.com/FreekMencke/claude-skills)), with [CLAUDE.md](CLAUDE.md) adding this
repo's sources, entry format and finishing steps. A research issue says "Run the `research` skill for …" and lists its
questions, instead of pasting a prompt. Cloud sessions don't load the plugin, so CLAUDE.md keeps the core reading rules.

Entries follow [CLAUDE.md](CLAUDE.md). When you add an entry or change its title or tags, update the topic file's
index row and run `node scripts/check-kb.ts --write`. After any change to entries, run the check; CI runs it on
every PR and push to `main`:

```bash
node scripts/check-kb.ts
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
| 24 + 10 | 72/72 | 29/30 | Opus 5.5 | 2.1.296 | 2026-10-17 |

The one miss (2026-10-17): `skips-9`, adding an Angular component, loaded the skill in 1 of 3 runs after the description
gained the stack topics (FreekMencke/claude-kb#175).

Runs are isolated per plugin, so they can't show overlap with skills in other repos.

## Re-verification routine

A cloud routine, "claude-kb re-verification" at [claude.ai/code/routines](https://claude.ai/code/routines),
runs at 06:00 UTC on the 1st and 15th of each month on Sonnet 5.5. It re-checks every official-docs and official-example entry against its
sources, updates Last verified, logs corrections in CHANGELOG.md, checks new and changed entries for overlap, and opens
a PR from `claude/reverify-<YYYY-MM-DD>`. Its prompt lives in the routine, not in this repo.

- **Reviewing it:** spot-check the removals and "unverified" marks before merging.
- **Debugging it:** RemoteTrigger `list_runs` and `get_run_log`; pause or delete it on the routines page.

<details>
<summary>Why it works this way</summary>

- **The 1st and 15th, not every 14 days:** cron has no "every two weeks", so the gaps are 14 to 17 days.
- **A PR, not a push to `main`:** a wrong correction to an entry every agent trusts should be reviewed first.
- **Subagents curl and grep sources for exact wording:** the first run
  ([FreekMencke/claude-kb#1](https://github.com/FreekMencke/claude-kb/pull/1)) changed 25 entries and 8 were wrong, 6 of
  them claims it couldn't find in a truncated fetch. Now a claim it can't find stays, listed as "not found"; only a
  contradicting quote changes it.
- **Overlap checks cover only new and changed entries:** the topic files were reconciled once in full
  (FreekMencke/claude-kb#28), and per-file subagents can't see other files. The lead resolves each overlap and each
  `check-kb.ts` duplicate warning in OVERLAPS.md and lists them in the PR body.
- **It opens the PR with the cloud session's GitHub tool:** `gh pr create` uses GraphQL, which returns 403 in cloud
  sessions.

</details>

## Design decisions

<details>
<summary>Why the knowledge base is built this way</summary>

- **Plain Markdown in git, keyword search, no vector search.** At this size an index plus keyword search (grep, or the
  server's SQLite FTS5) beats semantic search, and files stay reviewable. Revisit if lookups start failing.
- **Opus leads, Sonnet readers.** Research ran with an Opus 5.5 lead at high effort and Sonnet subagents (or a
  workflow) reading sources. Judging sources is the hard part; Haiku readers risk errors every agent inherits.
- **Only the lead writes files.** Research subagents return findings with source URLs.
- **Facts apart from recommendations.** Each topic file ends with "Recommendations for our setup" and "Open
  questions", because they're specific to our setup and go stale faster.
- **A file per kind of question, not per feature.** Prompting and memory are separate files because agents look them
  up separately; research-tool cost is a section of `kb-token-usage.md` at a handful of entries
  (FreekMencke/claude-kb#18).
- **One knowledge base for Claude and the stack it works on** (FreekMencke/claude-kb#167, 2026-10-17). Stack topics
  share the server, the plugin and the research rules; their primary sources are each vendor's docs and changelogs and
  the npm registry (CLAUDE.md). File names and prefixes name the technology (`kb-js-testing.md`, `JSTEST`), so a
  generic `TEST` doesn't clash with later topics, and prefixes are letters only: `check-kb.ts` and the server match
  `[A-Z]+-\d+`.
- **Link, don't repeat.** Topic files link to neighbouring entries instead of covering them; overlaps kept on purpose
  are listed in OVERLAPS.md, and duplicates are merged with a pointer, never renumbered. An open question raised in two
  files lives in one. Cross-file pointers name entry IDs, not issues.
- **INDEX.md holds only what answers a lookup**, because `kb_quick_answers` returns its Quick answers whole. The
  Claude rows stay near 30 (each topic file keeps its own 10–15). Stack topics get at most one row per file, in their
  own table under "The stack Claude works on", so the 23 planned files add about 23 rows, not 70
  (FreekMencke/claude-kb#175, 2026-10-17). Curation records and history live in OVERLAPS.md and CHANGELOG.md.
- **The entry list is grepped, not read.** At 504 entries it was 51 of INDEX.md's 74 KB, so it moved to a generated
  ENTRIES.md, and the topic files to `topics/` (2026-10-13).
- **The lookup skill runs forked on Haiku** (`context: fork`), keeping the lookup out of the caller's context
  (SKILL-009). Reading a checkout, it cost about 0.19 USD a lookup against 0.57 inline, with the same entries and facts
  (FreekMencke/claude-skills#7, 2026-10-12). Through the server's tools, it cost 0.24 USD a lookup, with the caller's
  follow-up turn on Opus 5.5, against 0.35 for the main session calling the tools itself, and cited the expected
  entries in 12 of 12 runs against 10 of 12 (FreekMencke/claude-kb#114, 2026-10-15).
- **The lookup skill reads only the server**, never a checkout (2026-10-15): the same forked skill answered in a median
  22.7 s through `kb_search` and `kb_get` against 32.4 s fetching and grepping a checkout, with 138k against 207k Haiku
  input tokens and the same accuracy (MCP-041). It gives up unmerged entries and the index's Conflicts section.

How the knowledge base was built (each research, merge and skill step's prompts and test results) is in the git
history up to `60cd4a7`, in the former `HANDOFF.md`.

</details>

## License

The knowledge base (the topic files, the index files, the docs and `assets/`) is licensed under
[CC BY-NC 4.0](LICENSE): use and adapt it, and run your own copy, with credit and a link back, but not commercially.
The code (`mcp-server/`, `scripts/` and `.github/`) is under the [MIT License](LICENSE-MIT). Text quoted from
Anthropic's docs and other sources stays under its owners' terms.
