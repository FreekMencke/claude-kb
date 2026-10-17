/**
 * The MCP tools (FreekMencke/claude-kb#112): each one's definition, argument checks and the text it returns, built
 * from a kb-index.ts Index. mcp.ts serves them.
 *
 * Plain text with entry IDs everywhere, so an answer can cite them, and a `corpus: <commit>` line last. Results land in
 * the caller's context, so they're capped and say what was cut. A bad argument throws a ToolError, which mcp.ts
 * returns as `isError: true` with the message; the message says what to pass instead.
 */
import { type Entry, type Index, INDEX_TOPIC, normalId } from './kb-index.ts';
import { searchEmpty, type ToolName } from './metrics.ts';
import type { KbState } from './server.ts';

export const TYPES = ['fact', 'pattern', 'recommendation', 'anti-pattern', 'tool', 'comparison'];
const LIMIT = { min: 1, max: 20, default: 8 };
const IDS = { min: 1, max: 10 };
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
  'claude-kb is a knowledge base on using Claude and Claude Code efficiently, and on the stack it works in (Angular,' +
  ' TypeScript, Node.js, npm, GitHub Actions). Search with kb_search, then kb_get the 1 to 4 best IDs for the full entries. Cite entry IDs (such as MCP-017) in answers. Check an entry last verified' +
  ` more than ${STALE_DAYS} days ago against its sources before relying on it.`;

/** A bad argument or a knowledge base that hasn't loaded: mcp.ts returns the message as an `isError` result. */
export class ToolError extends Error {}

export type Args = Record<string, unknown>;

export interface Tool {
  definition: { name: ToolName; title: string; description: string; inputSchema: object; annotations: object };
  run: (state: KbState, args: Args) => string;
}

// Read-only tools can run without a per-call prompt
const READ_ONLY = { readOnlyHint: true, destructiveHint: false, openWorldHint: false };
const TOPIC = { type: ['string', 'null'], description: 'Only this topic: a name such as mcp or a prefix such as MCP' };

/**
 * Descriptions carry the usage rules too: claude.ai web and desktop drop `instructions` (anthropics/claude-ai-mcp#93).
 * Clients may not enforce the schema, so the arguments are checked again, with a message saying what to pass. Text
 * content only: with an output schema, Claude Code hands Claude the structured JSON instead.
 */
export const TOOLS: Tool[] = [
  {
    definition: {
      name: 'kb_search',
      title: 'Search the knowledge base',
      description:
        'Search claude-kb, a knowledge base on using Claude and Claude Code efficiently: models and effort, subagents,' +
        ' skills, hooks, prompting, CLAUDE.md and memory, MCP servers and connectors, sessions, workflows, tokens and' +
        ' caching, docs, SEO, visual and UI design; and versions, defaults and upgrade traps in Angular, TypeScript,' +
        ' Node.js, npm and GitHub Actions. Returns entry IDs with title, type, confidence, last-verified date' +
        ' and a summary. Search first, then kb_get the 1 to 4 best IDs. Cite entry IDs. Check an entry last verified' +
        ' more than 60 days ago against its sources.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Words, a phrase, or entry IDs such as MCP-017' },
          topic: TOPIC,
          type: { type: ['string', 'null'], description: `Only this entry type: ${TYPES.join(', ')}` },
          limit: {
            type: 'integer',
            minimum: LIMIT.min,
            maximum: LIMIT.max,
            default: LIMIT.default,
            description: 'How many entries',
          },
        },
        required: ['query'],
      },
      annotations: READ_ONLY,
    },
    run: (state, args) =>
      search(
        state.index,
        string(args, 'query'),
        optionalString(args, 'topic'),
        optionalString(args, 'type'),
        integer(args, 'limit', LIMIT.default),
      ),
  },
  {
    definition: {
      name: 'kb_get',
      title: 'Read entries',
      description:
        'The full Markdown of claude-kb entries by ID, with their sources, confidence, last-verified date and related' +
        ' IDs. A merged entry comes with the entry it points to.',
      inputSchema: {
        type: 'object',
        properties: {
          ids: {
            type: 'array',
            items: { type: 'string' },
            minItems: IDS.min,
            maxItems: IDS.max,
            description: 'Entry IDs, such as ["MCP-017", "TOK-005"]',
          },
        },
        required: ['ids'],
      },
      annotations: READ_ONLY,
    },
    run: (state, args) => get(state.index, strings(args, 'ids')),
  },
  {
    definition: {
      name: 'kb_quick_answers',
      title: 'Quick answers',
      description:
        "claude-kb's most-asked questions, each with a one-line answer and its entry IDs: across the knowledge base, or" +
        " for one topic together with that topic's recommendations for our setup.",
      inputSchema: {
        type: 'object',
        properties: { topic: { ...TOPIC, description: `${TOPIC.description}; leave out for all` } },
      },
      annotations: READ_ONLY,
    },
    run: (state, args) => quickAnswers(state.index, optionalString(args, 'topic')),
  },
  {
    definition: {
      name: 'kb_status',
      title: 'Knowledge base status',
      description: 'The claude-kb commit this server has loaded, its number of entries, and when it last indexed them.',
      inputSchema: { type: 'object', properties: {} },
      annotations: READ_ONLY,
    },
    run: state => state.statusText(),
  },
];

function string(args: Args, key: string): string {
  const value = args[key];
  if (typeof value !== 'string') throw new ToolError(`Pass ${key} as a string.`);
  return value;
}

function optionalString(args: Args, key: string): string | undefined {
  return args[key] == null ? undefined : string(args, key);
}

function integer(args: Args, key: string, fallback: number): number {
  const value = args[key] ?? fallback;
  if (!Number.isInteger(value)) throw new ToolError(`Pass ${key} as a whole number.`);
  return value as number;
}

function strings(args: Args, key: string): string[] {
  const value = args[key];
  if (!Array.isArray(value) || !value.every(v => typeof v === 'string')) {
    throw new ToolError(`Pass ${key} as a list of strings, such as ["MCP-017"].`);
  }
  return value;
}

export function loaded(index: Index | undefined): Index {
  if (index === undefined) throw new ToolError("The knowledge base hasn't loaded yet: try again in a minute.");
  return index;
}

function corpus(index: Index): string {
  return `corpus: ${index.commit}`;
}

function topicList(index: Index): string {
  return [...index.topics].map(([t, title]) => `- ${t} (${index.prefixes.get(t) ?? '?'}): ${title}`).join('\n');
}

function resolveTopic(index: Index, topic: string | undefined): string | undefined {
  if (!topic?.trim()) return undefined;
  const name = index.topic(topic);
  if (name === undefined) {
    throw new ToolError(
      `Unknown topic ${JSON.stringify(topic)}. Pass one of these names or prefixes:\n${topicList(index)}`,
    );
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
  topic?: string,
  type?: string,
  limit = LIMIT.default,
): string {
  const kb = loaded(index);
  if (!query.trim()) throw new ToolError('Pass a query: some words, a phrase, or entry IDs such as MCP-017.');
  if (limit < LIMIT.min || limit > LIMIT.max) {
    throw new ToolError(`Pass a limit from ${LIMIT.min} to ${LIMIT.max} (default ${LIMIT.default}).`);
  }
  const wantedType = type?.trim() || undefined;
  if (wantedType && !TYPES.includes(wantedType)) {
    throw new ToolError(`Unknown type ${JSON.stringify(type)}. Pass one of: ${TYPES.join(', ')}; or leave it out.`);
  }
  const name = resolveTopic(kb, topic);
  const hits = kb.search(query, { topic: name, type: wantedType, limit });
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
  const asked = ids.map(id => id.trim()).filter(Boolean);
  if (asked.length < IDS.min || asked.length > IDS.max) {
    throw new ToolError(`Pass ${IDS.min} to ${IDS.max} entry IDs, such as ["MCP-017"]; got ${asked.length}.`);
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

export function quickAnswers(index: Index | undefined, topic?: string): string {
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
  if (cut.length) {
    kept.push(`(${cut.length} more ${what} cut to keep this result small: ${cut.join(', ')}; ${advice}.)`);
  }
  return kept;
}
