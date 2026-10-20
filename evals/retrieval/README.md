# Retrieval eval

How well each way of finding entries works on this knowledge base. The results are in `topics/kb-knowledge-retrieval.md`
(RETR-010 to RETR-012). Run this before changing how `kb_search` ranks, or before adding embeddings (RETR-020).

| File | What it holds |
|---|---|
| `questions.json` | 100 Quick-answer rows, a seeded sample (mulberry32, seed 20261020) of the 574 at commit `c1ffe45` that name no entry ID. Each has the original question, a `natural` and a `hard` rewording by Sonnet 5.5, and the cited entry IDs as labels. `hard` avoids the terms in the question, answer and entry titles |
| `uncovered.json` | 20 questions next to the knowledge base's topics that no entry answered on 2026-10-20 |
| `run.ts` | Runs one arm: `bm25`, `kw`, `rerank`, `index`, `long`, `agent` or `uncovered` (see its header) |
| `score.ts` | Prints top-1, top-3 and top-5 hits and MRR per arm and set |

Node 22.18 or later, from the repo root:

```bash
node evals/retrieval/run.ts bm25 && node evals/retrieval/score.ts
```

Every other arm calls `claude -p` on Haiku. On 2026-10-20 a full run of all arms and sets cost about $3, more than half of it
the `long` arm's 934k-token prompt. The `agent` and `uncovered` arms need the server running locally
(`node server.ts --local --port 8765` from `mcp-server/` after `npm ci`). Results go to `evals/results/retrieval/`,
which git ignores; delete a result file to rerun that arm and set.

New entries change the labels: a later entry may answer a question better than the cited one, which would then show
as a miss. Check misses by hand before reading them as a ranking problem.
