/**
 * Retrieval eval for the knowledge base (RETR-010 to RETR-012): how often each way of finding entries puts an entry
 * that answers a question in the top 5.
 *
 *   node evals/retrieval/run.ts <arm> [set]
 *
 * Arms: bm25 (the server's search on the raw question), kw (Haiku writes keyword queries, fused by RRF), rerank (Haiku
 * picks from BM25's top 30), index (Haiku with ENTRIES.md in its prompt), long (Haiku with every topic file in its
 * prompt, about 934k tokens), agent (Haiku with the server's kb_search and kb_get, one question per run), uncovered
 * (the agent on questions no entry answers). Sets: original, natural, hard (default: all three).
 *
 * Every arm but bm25 runs `claude -p` on Haiku. The agent arms need the server running locally, from a worktree without
 * kb-knowledge-retrieval.md (it quotes these questions); see README.md.
 * Results go to evals/results/retrieval/ (ignored); score them with score.ts.
 */
import { execFile, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { load } from '../../mcp-server/kb-index.ts';

const ROOT = join(import.meta.dirname, '../..');
const OUT = join(ROOT, 'evals/results/retrieval');
const SETS = ['original', 'natural', 'hard'] as const;
type Set = (typeof SETS)[number];
interface Question {
  n: number;
  topic: string;
  question: string;
  natural: string;
  hard: string;
  cited: string[];
}

const repo = load(ROOT);
const questions: Question[] = JSON.parse(readFileSync(join(import.meta.dirname, 'questions.json'), 'utf8'));
const text = (q: Question, set: Set) => (set === 'original' ? q.question : q[set]);
// This eval's own topic file quotes its questions and names the uncovered technologies, so every arm leaves it out
const OWN = 'kb-knowledge-retrieval.md';
const OWN_PREFIX = 'RETR-';
const hits = (query: string, k: number) => repo.search(query, { limit: k + 25 }).filter(h => !h.entry.id.startsWith(OWN_PREFIX)).slice(0, k);
const top = (query: string, k: number) => hits(query, k).map(h => h.entry.id);
const batches = <T>(a: T[], n: number) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
const IDS = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: { type: 'object', properties: { n: { type: 'integer' }, ids: { type: 'array', items: { type: 'string' } } }, required: ['n', 'ids'] },
    },
  },
  required: ['items'],
};

mkdirSync(OUT, { recursive: true });

/** One `claude -p` call on Haiku with no built-in tools, returning its structured output; retried twice if it has none. */
function ask(prompt: string, schema: object, systemPromptFile?: string): { out: any; cost: number } {
  const args = ['-p', prompt, '--model', 'haiku', '--max-turns', '3', '--max-budget-usd', '3', '--strict-mcp-config', '--tools', ''];
  args.push('--output-format', 'json', '--json-schema', JSON.stringify(schema));
  if (systemPromptFile) args.push('--system-prompt-file', systemPromptFile);
  let cost = 0;
  for (let attempt = 1; ; attempt++) {
    let stdout: string;
    try {
      stdout = execFileSync('claude', args, { encoding: 'utf8', maxBuffer: 1 << 26, cwd: OUT });
    } catch (e: any) {
      stdout = e.stdout ?? '';
    }
    const j = JSON.parse(stdout || '{}');
    cost += j.total_cost_usd ?? 0;
    let out = j.structured_output;
    if (!out) try { out = JSON.parse(j.result); } catch {}
    if (out || attempt >= 3) return { out: out ?? { items: [] }, cost };
  }
}

/** The agent arm: Haiku with the local server's kb_search and kb_get, six questions at a time. */
async function agent(items: { n: number; question: string }[], uncovered: boolean): Promise<Record<number, any>> {
  const mcp = join(OUT, 'mcp.json');
  writeFileSync(mcp, JSON.stringify({ mcpServers: { kb: { type: 'http', url: 'http://127.0.0.1:8765/mcp' } } }));
  const schema = { type: 'object', properties: { ids: { type: 'array', items: { type: 'string' } }, answered: { type: 'boolean' } }, required: ['ids', 'answered'] };
  const results: Record<number, any> = {};
  const one = (item: { n: number; question: string }) =>
    new Promise<void>(done => {
      const prompt =
        'Find the entries in the claude-kb knowledge base that answer this question, using its kb_search and kb_get tools: ' +
        'kb_search with two to five keywords, search again with other words if nothing fits, kb_get the best IDs to check them. ' +
        'Then return the IDs of up to 5 entries that answer it, best first, and whether the knowledge base answers the question.' +
        (uncovered ? ' If no entry answers it, return an empty list and answered false.' : '') +
        `\n\nQuestion: ${item.question}`;
      const args = ['-p', prompt, '--model', 'haiku', '--max-turns', '12', '--max-budget-usd', '0.5', '--strict-mcp-config'];
      args.push('--mcp-config', mcp, '--tools', '', '--allowedTools', 'mcp__kb__kb_search,mcp__kb__kb_get');
      // kb_quick_answers returns the Quick-answer tables these questions come from
      args.push('--disallowedTools', 'mcp__kb__kb_quick_answers,mcp__kb__kb_status');
      args.push('--output-format', 'stream-json', '--verbose', '--json-schema', JSON.stringify(schema));
      const started = Date.now();
      execFile('claude', args, { cwd: OUT, maxBuffer: 1 << 26, encoding: 'utf8' }, (err, stdout) => {
        const lines = (stdout || '').split('\n').flatMap(l => { try { return [JSON.parse(l)]; } catch { return []; } });
        const result = lines.find(l => l.type === 'result') ?? {};
        const calls = lines
          .filter(l => l.type === 'assistant')
          .flatMap(l => l.message.content.filter((c: any) => c.type === 'tool_use').map((c: any) => ({ name: c.name, input: c.input })));
        let out: any = {};
        try { out = result.structured_output ?? JSON.parse(result.result); } catch {}
        results[item.n] = { top: out.ids ?? [], answered: out.answered, calls, cost: result.total_cost_usd ?? 0, ms: Date.now() - started, error: err ? String(err).slice(0, 200) : undefined };
        done();
      });
    });
  let next = 0;
  await Promise.all(Array.from({ length: 6 }, async () => { while (next < items.length) await one(items[next++]); }));
  return results;
}

async function run(arm: string, set: Set): Promise<{ results: Record<number, any>; cost: number }> {
  const results: Record<number, any> = {};
  let cost = 0;
  const asked = (b: Question[]) => JSON.stringify(b.map(q => ({ n: q.n, question: text(q, set) })), null, 1);
  if (arm === 'bm25') {
    for (const q of questions) results[q.n] = { top: top(text(q, set), 20) };
  } else if (arm === 'kw') {
    const schema = { type: 'object', properties: { items: { type: 'array', items: { type: 'object', properties: { n: { type: 'integer' }, queries: { type: 'array', items: { type: 'string' } } }, required: ['n', 'queries'] } } }, required: ['items'] };
    for (const b of batches(questions, 25)) {
      const r = ask(
        'You are looking things up in a knowledge base about Claude Code, the Claude API, and a web stack (Angular, TypeScript, Node, npm, CSS, fonts, GitHub Actions, Docker, Kubernetes and more). ' +
          'Its search tool is keyword search (BM25 over entry IDs, titles, tags and text). For each question, write up to 3 search queries of 2 to 5 keywords each, ' +
          `the words the answering entry most likely uses, the first being your best guess.\n\n${asked(b)}`,
        schema,
      );
      cost += r.cost;
      for (const it of r.out.items) {
        const lists: string[][] = it.queries.slice(0, 3).map((q: string) => top(q, 8));
        const score = new Map<string, number>();
        for (const l of lists) l.forEach((id, i) => score.set(id, (score.get(id) ?? 0) + 1 / (60 + i)));
        results[it.n] = { queries: it.queries, top: [...score].sort((a, b) => b[1] - a[1]).map(x => x[0]), seen: [...new Set(lists.flat())] };
      }
    }
  } else if (arm === 'rerank') {
    for (const b of batches(questions, 5)) {
      const items = b.map(q => ({
        n: q.n,
        question: text(q, set),
        candidates: hits(text(q, set), 30).map(h => `${h.entry.id}: ${h.entry.title} [${h.entry.tags.join(', ')}] ${h.entry.summary}`),
      }));
      const r = ask(`For each question, pick the up to 5 candidates most likely to answer it, best first, by their IDs. Pick only from that question's candidates.\n\n${JSON.stringify(items, null, 1)}`, IDS);
      cost += r.cost;
      for (const it of r.out.items) results[it.n] = { top: it.ids };
    }
  } else if (arm === 'index' || arm === 'long') {
    const file = join(OUT, `${arm}-system.md`);
    if (arm === 'index') {
      const entries = readFileSync(join(ROOT, 'ENTRIES.md'), 'utf8').split('\n').filter(l => !l.startsWith(`| ${OWN_PREFIX}`)).join('\n');
      writeFileSync(file, "You answer lookups against this knowledge base's index: every entry's ID, title, type and tags.\n\n" + entries);
    } else {
      // Every topic file without its Quick answers, which hold the original questions and their answers
      const topics = readdirSync(join(ROOT, 'topics')).filter(f => /^kb-.*\.md$/.test(f) && f !== OWN).sort();
      const corpus = topics.map(f => readFileSync(join(ROOT, 'topics', f), 'utf8')).join('').replace(/^## Quick answers\n[\s\S]*?(?=^## )/gm, '');
      writeFileSync(file, 'You answer lookups against this knowledge base. It follows in full.\n\n' + corpus);
    }
    const what = arm === 'index' ? 'from the knowledge base index' : '(the [PREFIX-NNN] headings) in the knowledge base';
    for (const b of batches(questions, 20)) {
      const r = ask(`For each question, pick the up to 5 entry IDs ${what} most likely to answer it, best first.\n\n${asked(b)}`, IDS, file);
      cost += r.cost;
      for (const it of r.out.items) results[it.n] = { top: it.ids };
    }
  } else if (arm === 'agent') {
    Object.assign(results, await agent(questions.map(q => ({ n: q.n, question: text(q, set) })), false));
    cost = Object.values(results).reduce((a, r) => a + r.cost, 0);
  } else {
    throw new Error(`Unknown arm ${arm}`);
  }
  return { results, cost };
}

const [arm, only] = process.argv.slice(2);
if (arm === 'uncovered') {
  const uncovered = JSON.parse(readFileSync(join(import.meta.dirname, 'uncovered.json'), 'utf8'));
  const results = await agent(uncovered, true);
  writeFileSync(join(OUT, 'uncovered.json'), JSON.stringify(results, null, 1));
  const answered = Object.values(results).filter(r => r.answered || r.top.length).length;
  console.log(`uncovered: ${answered} of ${uncovered.length} claimed an answer`);
} else {
  for (const set of only ? [only as Set] : SETS) {
    const file = join(OUT, `${arm}-${set}.json`);
    if (existsSync(file)) continue;
    const { results, cost } = await run(arm, set);
    writeFileSync(file, JSON.stringify(results, null, 1));
    console.log(`${arm} ${set}: done, $${cost.toFixed(3)}`);
  }
}
