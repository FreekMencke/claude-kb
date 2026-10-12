# claude-kb

A Markdown knowledge base on using Claude efficiently, written for agents to query: model and effort choice,
subagents and orchestration, agents in repos, token usage and caching, writing skills, and prompting the current
models. Every entry carries its sources, a confidence level and a last-verified date.

## Querying it

From any repo, the `claude-kb-lookup` skill answers questions from this knowledge base and cites entry IDs. It lives in
the `freek-local-skills` plugin of [FreekMencke/claude-skills](https://github.com/FreekMencke/claude-skills)
(`local-skills/skills/claude-kb-lookup/`); install it with that repo's `install.sh`.

- It runs as a forked subagent on Haiku (`context: fork`), so the index stays out of the caller's context: a lookup
  cost about 0.19 USD against 0.57 inline, with the same entries and facts (FreekMencke/claude-skills#7, 2026-10-12).
- The fork can't see the conversation, so pass it a self-contained question, and keep its entry IDs in the reply.
- It reads a local clone at `/home/fremen/repos/claude-kb` and fast-forwards it before each lookup, so it doesn't work
  in cloud sessions.

By hand: start at [INDEX.md](INDEX.md), find the question in Quick answers or the entry in the index, then read only
that entry:

```bash
grep -n '^## \[TOK-036\]' kb-*.md
```

Treat an entry last verified more than 60 days ago as a lead to re-check, not a fact.

## Layout

| File | What it holds |
|---|---|
| [INDEX.md](INDEX.md) | Entry point: combined Quick answers, every entry by topic, then Conflicts, Overlaps kept on purpose, Merges and a Changelog |
| [kb-orchestration.md](kb-orchestration.md) | `ORCH`: orchestration, parallelization and model selection |
| [kb-token-usage.md](kb-token-usage.md) | `TOK`: token usage and context efficiency |
| [kb-skills.md](kb-skills.md) | `SKILL`: writing, testing and distributing skills |
| [kb-repo-agents.md](kb-repo-agents.md) | `REPO`: agents in repositories (osrs-tracker-web) |
| [kb-sessions.md](kb-sessions.md) | `SESS`: several sessions in one repo (worktrees, shared state, messaging, keeping branches current) |
| [kb-hooks.md](kb-hooks.md) | `HOOK`: writing, scoping, debugging, securing and pricing hooks |
| [kb-infra-agents.md](kb-infra-agents.md) | `INFRA`: agents with cloud and cluster access: credentials, MCP servers, rules, auto mode, audit trails, incidents |
| [kb-prompting.md](kb-prompting.md) | `PROMPT`: instructing the 5.x models: prompt wording, CLAUDE.md and agent bodies, subagent briefs |
| [CLAUDE.md](CLAUDE.md) | Research instructions and the entry format; every session in this repo loads it |
| [scripts/check_kb.py](scripts/check_kb.py) | Format check: required fields, duplicate IDs, broken `Related` links, entry length, INDEX.md coverage |

Each topic file ends with "Recommendations for our setup" and "Open questions", kept apart from the facts because
they go stale faster.

## Changing it

- Follow the entry format in [CLAUDE.md](CLAUDE.md). When a title changes, edit the topic file's index row and patch
  INDEX.md to match.
- Run the check after any change to entries. CI runs it on every push to `main` and every PR.

  ```bash
  python3 scripts/check_kb.py
  ```

## Monthly re-verification

A cloud routine, [claude-kb monthly re-verification](https://claude.ai/code/routines/trig_01HDV9ENf7vGtyTF52Lb4qTW),
runs at 06:00 UTC on the 1st of each month on Sonnet 5.5. It re-checks every official-docs and official-example entry
against its sources, sets Last verified, logs corrections in INDEX.md's Changelog, and opens a PR from
`claude/reverify-<YYYY-MM>`. Its prompt lives in the routine, not in this repo.

- **Why a PR, not a push to main:** a wrong correction to an entry every agent trusts should be reviewed first.
- **Why its subagents curl and grep sources for exact wording:** the first run ([FreekMencke/claude-kb#1](https://github.com/FreekMencke/claude-kb/pull/1)) changed 25 entries and 8 of
  those were wrong, 6 of them claims it couldn't find in a truncated fetch and then removed or marked unverified. Now a
  claim it can't find stays and is listed as "not found"; only a contradicting quote changes it.
- **Reviewing it:** spot-check the removals and "unverified" marks before merging.
- **Debugging it:** RemoteTrigger `list_runs` and `get_run_log`. Pause or delete it at https://claude.ai/code/routines.
- It opens the PR with the cloud session's GitHub tool, because `gh pr create` uses GraphQL, which returns 403 in
  cloud sessions.

## Design decisions

- **Plain Markdown in git, no memory connector or vector search.** At this size an index plus grep beats semantic
  search, files stay reviewable, and no tool definitions are added to every session. Revisit if lookups start failing
  or the knowledge base sprawls.
- **Opus leads, Sonnet readers.** New research sessions ran with an Opus 5.5 lead at high effort and Sonnet subagents
  (or a workflow) reading sources. The hard part is judging and reconciling sources; Haiku readers risk errors in a
  knowledge base every agent trusts.
- **Only the lead writes files.** Research subagents return findings with source URLs ([CLAUDE.md](CLAUDE.md)).
- **Facts apart from recommendations.** Recommendations are specific to our setup and go stale faster.

How the knowledge base was built (the prompts for each research, merge and skill step, and their test results) is in
the git history up to `786847b`, in the former `HANDOFF.md`.
