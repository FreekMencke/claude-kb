/**
 * The text the MCP tools return, built from a kb-index.ts Index (FreekMencke/claude-kb#112).
 *
 * Plain text with entry IDs everywhere, so an answer can cite them, and a `corpus: <commit>` line last. Results land in
 * the caller's context, so they're capped and say what was cut. A bad argument throws a ToolError, which mcp.ts
 * returns as `isError: true` with the message; the message says what to pass instead.
 */
import { strip } from '../scripts/kb-parse.ts';
import { type Entry, type Index, INDEX_TOPIC, normalId } from './kb-index.ts';
import { searchEmpty } from './metrics.ts';

export const TYPES = ['fact', 'pattern', 'recommendation', 'anti-pattern', 'tool', 'comparison'];
const SEARCH_LIMIT = [1, 20] as const;
const GET_IDS = [1, 10] as const;
export const MAX_CHARS = {
  // kb_search's 8 hits come to about 3 KB; this only bites at a high limit with long titles
  search: 8_000,
  // About 10,000 tokens, where Claude Code starts warning about large MCP output (its hard cap is 25,000). Ten of the
  // longest entries came to 28,000 characters on 2026-10-15.
  get: 40_000,
};
// INDEX.md's "treat an entry last verified more than 60 days ago as a lead to re-check"
const STALE_DAYS = 60;
export const SEPARATOR = '\n\n---\n\n';
const ID_SHAPE = /^([A-Z]+)-(\d+)$/;
const DAY_MS = 86_400_000;

export const INSTRUCTIONS =
  'claude-kb is a knowledge base on using Claude and Claude Code efficiently. Search with kb_search, then kb_get the' +
  ' 1 to 4 best IDs for the full entries. Cite entry IDs (such as MCP-017) in answers. Check an entry last verified' +
  ` more than ${STALE_DAYS} days ago against its sources before relying on it.`;

/** A bad argument or a knowledge base that hasn't loaded: mcp.ts returns the message as an `isError` result. */
export class ToolError extends Error {}

function loaded(index: Index | undefined): Index {
  if (index === undefined) throw new ToolError("The knowledge base hasn't loaded yet: try again in a minute.");
  return index;
}

function corpus(index: Index): string {
  return `corpus: ${index.commit}`;
}

function topicList(index: Index): string {
  return [...index.topics].map(([t, title]) => `- ${t} (${index.prefixes.get(t) ?? '?'}): ${title}`).join('\n');
}

function resolveTopic(index: Index, topic: string | null | undefined): string | undefined {
  if (topic == null || !strip(topic)) return undefined;
  const name = index.topic(topic);
  if (name === undefined) {
    throw new ToolError(`Unknown topic ${JSON.stringify(topic)}. Pass one of these names or prefixes:\n${topicList(index)}`);
  }
  return name;
}

function age(entry: Entry, today: Date): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(entry.lastVerified);
  if (!m) return '';
  const verified = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  // Not a real date, such as 2026-02-30
  if (verified.getUTCMonth() !== Number(m[2]) - 1 || verified.getUTCDate() !== Number(m[3])) return '';
  const days = Math.floor((utcDay(today) - verified.getTime()) / DAY_MS);
  return days > STALE_DAYS ? `, ${days} days ago: check its sources` : '';
}

function utcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function hitLine(entry: Entry, today: Date): string {
  const merged = entry.mergedInto.length ? `, merged into ${entry.mergedInto.join(', ')}` : '';
  return (
    `${entry.id}: ${entry.title} (${entry.type}, ${entry.confidence}, last verified ${entry.lastVerified}` +
    `${age(entry, today)}${merged})`
  );
}

export function search(
  index: Index | undefined,
  query: string,
  topic?: string | null,
  type?: string | null,
  limit = 8,
): string {
  const kb = loaded(index);
  if (!query || !strip(query)) throw new ToolError('Pass a query: some words, a phrase, or entry IDs such as MCP-017.');
  if (!(SEARCH_LIMIT[0] <= limit && limit <= SEARCH_LIMIT[1])) {
    throw new ToolError(`Pass a limit from ${SEARCH_LIMIT[0]} to ${SEARCH_LIMIT[1]} (default 8).`);
  }
  if (type != null && strip(type) && !TYPES.includes(strip(type))) {
    throw new ToolError(`Unknown type ${JSON.stringify(type)}. Pass one of: ${TYPES.join(', ')}; or leave it out.`);
  }
  const name = resolveTopic(kb, topic);
  const hits = kb.search(query, { topic: name, type: strip(type ?? '') || undefined, limit });
  if (!hits.length) {
    searchEmpty.inc();
    const where = name ? ` in topic ${name}` : '';
    return (
      `No entries match ${JSON.stringify(query)}${where}. Try other words, or kb_quick_answers for a topic's most-asked` +
      ` questions. Topics:\n${topicList(kb)}\n\n${corpus(kb)}`
    );
  }
  const today = new Date();
  const blocks: [string, string][] = hits.map(h => [h.entry.id, `${hitLine(h.entry, today)}\n${h.entry.summary}`]);
  const kept = fit(blocks, MAX_CHARS.search, '\n\n', 'hits', 'lower the limit or narrow the query');
  return [...kept, corpus(kb)].join('\n\n');
}

export function get(index: Index | undefined, ids: string[]): string {
  const kb = loaded(index);
  const asked = ids.filter(i => i && strip(i)).map(strip);
  if (!(GET_IDS[0] <= asked.length && asked.length <= GET_IDS[1])) {
    throw new ToolError(`Pass ${GET_IDS[0]} to ${GET_IDS[1]} entry IDs, such as ["MCP-017"]; got ${asked.length}.`);
  }
  const found = kb.get(asked);
  const known = new Set(found.map(e => e.id));
  // A merged entry is a pointer: add the entries it points to, after everything asked for
  const targets = found.flatMap(e => kb.get(e.mergedInto)).filter(t => !known.has(t.id));
  const entries = [...new Map([...found, ...targets].map(e => [e.id, e])).values()];
  const notes = asked.filter(i => !kb.get([i]).length).map(i => unknown(kb, i));
  if (!entries.length) throw new ToolError(notes.join('\n'));
  const blocks = fit(
    entries.map(e => [e.id, e.body]),
    MAX_CHARS.get,
    SEPARATOR,
    'entries',
    'kb_get them separately',
  );
  return `${blocks.join(SEPARATOR)}\n\n${[...notes, corpus(kb)].join('\n')}`;
}

/**
 * A line for an ID that isn't in the KB: the three numerically nearest IDs with its prefix, the known prefixes when no
 * topic has it, or for words the best search hits.
 */
function unknown(index: Index, asked: string): string {
  const id = ID_SHAPE.exec(normalId(asked));
  let nearest: Entry[];
  if (id) {
    const [, prefix, number] = id;
    const distance = (e: Entry) => Math.abs(Number(e.id.slice(prefix.length + 1)) - Number(number));
    nearest = [...index.entries.values()]
      .filter(e => e.id.startsWith(`${prefix}-`))
      .sort((a, b) => distance(a) - distance(b) || (a.id < b.id ? -1 : 1))
      .slice(0, 3);
    if (!nearest.length) {
      return `${asked}: no such entry, and no topic uses ${prefix}. Prefixes: ${[...index.prefixes.values()].join(', ')}.`;
    }
  } else {
    nearest = index.search(asked, { limit: 3 }).map(h => h.entry);
  }
  if (!nearest.length) return `${asked}: no such entry. kb_search finds entries by words.`;
  return `${asked}: no such entry. Closest: ${nearest.map(e => `${e.id} (${e.title})`).join('; ')}`;
}

export function quickAnswers(index: Index | undefined, topic?: string | null): string {
  const kb = loaded(index);
  const name = resolveTopic(kb, topic);
  if (name === undefined) {
    const table = kb.quickAnswers.get(INDEX_TOPIC) ?? '';
    return (
      `# Quick answers across the knowledge base\n\n${table}\n\n` +
      `Each topic has its own (pass topic):\n${topicList(kb)}\n\n${corpus(kb)}`
    );
  }
  const parts = [`# ${kb.topics.get(name)}: Quick answers\n\n${kb.quickAnswers.get(name) ?? '(none)'}`];
  const recs = kb.recommendations.get(name);
  if (recs) parts.push(`## Recommendations for our setup (these go stale faster than the facts)\n\n${recs}`);
  return [...parts, corpus(kb)].join('\n\n');
}

/** As many whole (ID, text) blocks as fit in maxChars, then a line naming the IDs cut: never a silent cut. */
function fit(blocks: [string, string][], maxChars: number, joiner: string, what: string, advice: string): string[] {
  const kept: string[] = [];
  let size = 0;
  for (const [, text] of blocks) {
    size += text.length + joiner.length;
    if (kept.length && size > maxChars) break;
    kept.push(text);
  }
  const cut = blocks.slice(kept.length).map(([id]) => id);
  if (cut.length) kept.push(`(${cut.length} more ${what} cut to keep this result small: ${cut.join(', ')}; ${advice}.)`);
  return kept;
}
