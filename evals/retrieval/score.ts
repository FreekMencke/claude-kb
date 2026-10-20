/**
 * Scores the results of run.ts: per arm and question set, how many questions had a cited entry at rank 1, in the top 3
 * and in the top 5, and the mean reciprocal rank over the top 5.
 *
 *   node evals/retrieval/score.ts
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = join(import.meta.dirname, '../results/retrieval');
const questions: { n: number; cited: string[] }[] = JSON.parse(readFileSync(join(import.meta.dirname, 'questions.json'), 'utf8'));
const norm = (id: string) => id.replace(/[[\]\s]/g, '').toUpperCase();

console.log('| Arm | Set | n | @1 | @3 | @5 | MRR@5 |');
console.log('|---|---|---|---|---|---|---|');
for (const arm of ['bm25', 'kw', 'rerank', 'index', 'long', 'agent']) {
  for (const set of ['original', 'natural', 'hard']) {
    const file = join(OUT, `${arm}-${set}.json`);
    if (!existsSync(file)) continue;
    const results = JSON.parse(readFileSync(file, 'utf8'));
    const rows = questions.filter(q => results[q.n] && !results[q.n].error);
    const rank = (q: (typeof rows)[number]) => (results[q.n].top ?? []).slice(0, 5).map(norm).findIndex((id: string) => q.cited.includes(id));
    const at = (k: number) => rows.filter(q => rank(q) >= 0 && rank(q) < k).length;
    const mrr = rows.reduce((a, q) => a + (rank(q) >= 0 ? 1 / (rank(q) + 1) : 0), 0) / rows.length;
    console.log(`| ${arm} | ${set} | ${rows.length} | ${at(1)} | ${at(3)} | ${at(5)} | ${mrr.toFixed(2)} |`);
  }
}
