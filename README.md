# claude-kb

A Markdown knowledge base on using Claude efficiently, written for agents to query: model and effort choice,
subagents and orchestration, agents in repos, token usage and caching, and writing skills. Every entry carries its
sources, a confidence level and a last-verified date.

## Querying it

From any repo, the `claude-kb-lookup` skill in [FreekMencke/claude-skills](https://github.com/FreekMencke/claude-skills)
answers questions from this knowledge base and cites entry IDs. It reads a local clone at
`/home/fremen/repos/claude-kb` and fast-forwards it before each lookup. Install it with that repo's `install.sh`.

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
| [CLAUDE.md](CLAUDE.md) | Research instructions and the entry format; every session in this repo loads it |
| [HANDOFF.md](HANDOFF.md) | Project status, the prompts each step ran with, and the decisions behind them |
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

- A monthly cloud routine re-verifies official-docs and official-example entries against their sources and opens a PR
  from `claude/reverify-<YYYY-MM>`. Spot-check its removals and "unverified" marks before merging; see
  [HANDOFF.md](HANDOFF.md#step-5-monthly-re-verification-done).
