# Handoff: building the Claude efficiency knowledge base

Read this file to pick up the project. It holds the goal, what's done, what's next with the exact prompts, and the decisions behind them. Update the Status section when you finish a step.

## Goal

A Markdown knowledge base on using Claude efficiently that other agents can query like a database. Topics: orchestration and model choice, agents in repos (osrs-tracker-web), token usage, and writing skills. Each topic is researched from official Anthropic docs first, then popular community solutions. Every claim carries sources and a verified date.

## How the repo works

- `CLAUDE.md` holds the shared research instructions and the entry format. Every session and subagent in this repo loads it, so topic prompts only contain the topic.
- `kb-<topic>.md` files: one per research session. Each has a Quick answers table, an index, entries `## [PREFIX-NNN]`, then "Recommendations for our setup" and "Open questions".
- Prefixes: ORCH (orchestration), TOK (token usage), SKILL (skills), REPO (repo agents).
- `scripts/check_kb.py` checks every `kb-*.md` against the format: required fields, duplicate IDs, broken `Related` links, entry length, confidence values. Run it with `python3 scripts/check_kb.py` after any step that changes entries.

## Status (2026-10-12)

| Step | What | Model / effort | Status |
|---|---|---|---|
| 0 | Repo + `CLAUDE.md` | — | Done |
| 1 | Sessions 1, 3, 4 → `kb-orchestration.md`, `kb-token-usage.md`, `kb-skills.md` | Opus 5.5 lead, Sonnet research agents, high | Done: 167 entries, all pass the format check |
| 2 | Session 2 → `kb-repo-agents.md` (osrs-tracker-web) | Opus 5.5 lead, Sonnet research and fact-check agents, high | Done: 52 entries, pass the format check; follow-up work in roadmap osrs-tracker/osrs-tracker-web#220 |
| 3 | Merge and index → `INDEX.md` | Sonnet 5.5, high | Next, after step 2 |
| 4 | Librarian skill `claude-kb-lookup` | Sonnet 5.5, medium | After step 3 |
| 5 | Monthly re-verification | Sonnet 5.5, medium | After step 4, as a scheduled task |

## Known issues for the merge step

Found by the format check after step 1. The first two are fixed (2026-10-12); `python3 scripts/check_kb.py` passes on the three step 1 files.

- Fixed: `kb-skills.md` had 20 Quick answers rows. Overlapping rows were merged down to 15 (testing with measuring, pruning with roster size, the five desktop/WSL rows into two); no answer was dropped.
- Fixed: 18 entries in `kb-token-usage.md` put a qualifier in Confidence. Each now has one allowed value (the weakest that applies to its main claim), and the qualifier moved to a `Confidence note:` line at the end of the entry.
- Open: subagent model choice appears in both ORCH-005/ORCH-030 and TOK-036. They agree, so this is a dedupe, not a conflict.
- Intended: ORCH-047 (the decision table) cites other entries instead of URLs, because it's a synthesis.

## Next steps and their prompts

### Step 3: merge and index

Start a new session in this repo on Sonnet 5.5 at high effort, after `kb-repo-agents.md` is committed:

```
Read all kb-*.md files in this repo. Then:
1. Write INDEX.md: every entry's ID, title, type, tags and file, grouped by topic, plus one combined "Quick answers" table of the 25 questions agents are most likely to ask.
2. Deduplicate: where two entries cover the same thing, keep the better-sourced one, replace the other with a one-line pointer to it, and list the merges at the end of INDEX.md.
3. Where entries contradict each other, add a "Conflicts" section to INDEX.md naming both IDs and which one the sources support.
4. Check that every Related: reference points to an ID that exists.
5. Fix the issues listed under "Known issues for the merge step" in HANDOFF.md.
Don't rewrite entries beyond this. Run python3 scripts/check_kb.py at the end and fix what it reports.
```

### Step 4: librarian skill

Sonnet 5.5 at medium effort. Replace `<path>` with where this repo is cloned locally:

```
/skill-workshop Write a user-level skill named claude-kb-lookup. It triggers when an agent needs information about using Claude efficiently (models, subagents, skills, repo agents, token usage). It tells the agent to read <path>/claude-kb/INDEX.md first, then read only the entries it needs by ID, cite entry IDs in its answer, and flag any entry whose Last verified date is more than 60 days old.
```

Put it in the user skills folder (`~/.claude/skills/`) so every repo gets it.

### Step 5: monthly re-verification

Set up as a monthly scheduled task on this repo, Sonnet 5.5 at medium effort:

```
Re-verify this knowledge base. For every entry in kb-*.md with Confidence official-docs or official-example: fetch its Sources, check the entry still matches them, and set Last verified to today. If something changed, correct the entry and add a line to a "Changelog" section at the end of INDEX.md (date, ID, what changed). Mark entries whose source no longer exists as unverified. Use a workflow with Sonnet agents, one per file or per ~15 entries; they return proposed edits and you apply them. Leave "Recommendations for our setup" alone, except to flag in the changelog any recommendation whose cited entry changed. Run python3 scripts/check_kb.py at the end, then commit and push.
```

## Decisions and why

- **Opus 5.5 at high for research leads, Sonnet for the reading agents.** The hard part is judging and reconciling sources. Haiku for reading would risk errors in a knowledge base every agent trusts. xhigh/max add thinking tokens without helping breadth.
- **Workflows for research.** Claude Code's dynamic workflows fan out and cross-check sources; topic prompts end with a line asking for one.
- **Session 2 runs after 1, 3 and 4.** It's the applied session for osrs-tracker-web and builds on the other three files instead of re-researching them.
- **Plain Markdown in git, no memory connector.** At this size, an index plus grep beats semantic search. Files stay reviewable and versioned, and add no tool definitions to every session. Revisit if lookups start failing or the knowledge base sprawls.
- **Subagents don't write files.** `CLAUDE.md` tells research subagents to return findings instead, so only the lead writes the topic file.
- **Facts separate from recommendations.** Recommendations go stale faster and are specific to our setup, so they live in their own section.
