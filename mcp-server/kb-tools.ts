/**
 * The MCP tools (FreekMencke/claude-kb#112): each one's definition, argument checks and the text it returns, built
 * from a kb-index.ts Index. mcp.ts serves them.
 *
 * Plain text with entry IDs everywhere, so an answer can cite them, and a `corpus: <commit>` line last. Results land in
 * the caller's context, so they're capped and say what was cut. A bad argument throws a ToolError, which mcp.ts
 * returns as `isError: true` with the message; the message says what to pass instead.
 */
import { APPLIES_TO, CONFIDENCE } from '../scripts/kb-parse.ts';
import { type Entry, type Index, INDEX_TOPIC, normalId, STACK_TOPIC } from './kb-index.ts';
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
  ' TypeScript, Node.js, npm, NestJS, Express, MongoDB, lint and build tools, JS testing, CSS, page layout and spacing' +
  ' (grids, breakpoints, spacing scales, alignment), web animation (Motion, GSAP, Lenis), data visualisation (charts,' +
  ' tables, colour, formatting), UI states and forms, web fonts,' +
  ' accessibility, web performance and security, GitHub and its Actions, Docker, Kubernetes and Flux, AWS Lambda,' +
  ' licences), on knowledge retrieval and RAG, and on engineering skill packs, spec-driven development, codebase' +
  ' maps, browsers for agents, writing style, and AI images and icons. Search' +
  ' with kb_search (it can filter by topic, type, confidence and applies_to), then kb_get the 1 to 4 best IDs for the' +
  ' full entries; kb_get adds a line when an entry is in an open conflict. Cite entry IDs (such as MCP-017) in answers.' +
  ` Check an entry last verified more than ${STALE_DAYS} days ago against its sources before relying on it.`;

/** A bad argument or a knowledge base that hasn't loaded: mcp.ts returns the message as an `isError` result. */
export class ToolError extends Error {}

export type Args = Record<string, unknown>;

/**
 * What a tool call adds to its request's log line: the entry IDs it returned, never the query or other free text
 * (README, "Logs"). For kb_get, the IDs found and how many asked-for IDs weren't.
 */
export interface ToolLog {
  ids?: string[];
  unknown?: number;
}
export type Note = (log: ToolLog) => void;

export interface Tool {
  definition: { name: ToolName; title: string; description: string; inputSchema: object; annotations: object };
  run: (state: KbState, args: Args, note: Note) => string;
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
        ' skills and vetting community skills, hooks, prompting, CLAUDE.md and memory, MCP servers and connectors, the' +
        ' Claude API and Agent SDK, sessions, workflows, tokens and caching, knowledge retrieval and RAG, engineering' +
        ' skill packs, spec-driven development, codebase maps, browsers for agents, docs, writing style, SEO, visual' +
        ' and UI design, community' +
        ' design skills, UI review, typography; and versions, defaults and upgrade traps in Angular, TypeScript, Node.js,' +
        ' npm, NestJS, Express, MongoDB, lint and build tools, JS testing, CSS, page layout, spacing and alignment, web' +
        ' animation (Angular, Motion, GSAP,' +
        ' Lenis), data visualisation and charts, UI states and forms, web fonts, accessibility, web performance and' +
        ' security (CSP, cookies, OWASP), OG images, AI images and icons, GitHub' +
        ' and gh, GitHub Actions, Docker, Kubernetes and Flux, AWS Lambda and open-source licences. Returns entry IDs' +
        ' with title, type, confidence, last-verified date' +
        ' and a summary. Filter by topic, type, confidence or applies_to. Search first, then kb_get the 1 to 4 best IDs.' +
        ' Cite entry IDs. Check an entry last verified more than 60 days ago against its sources.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Words, a phrase, or entry IDs such as MCP-017' },
          topic: TOPIC,
          type: { type: ['string', 'null'], description: `Only this entry type: ${TYPES.join(', ')}` },
          confidence: { type: ['string', 'null'], description: `Only this confidence: ${CONFIDENCE.join(', ')}` },
          applies_to: {
            type: ['string', 'null'],
            description: `Only entries that apply to this (an entry may list several): ${APPLIES_TO.join(', ')}`,
          },
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
    run: (state, args, note) =>
      search(
        state.index,
        string(args, 'query'),
        {
          topic: optionalString(args, 'topic'),
          type: optionalString(args, 'type'),
          confidence: optionalString(args, 'confidence'),
          appliesTo: optionalString(args, 'applies_to'),
          limit: integer(args, 'limit', LIMIT.default),
        },
        note,
      ),
  },
  {
    definition: {
      name: 'kb_get',
      title: 'Read entries',
      description:
        'The full Markdown of claude-kb entries by ID, with their sources, confidence, last-verified date and related' +
        ' IDs. A merged entry comes with the entry it points to; an entry in an open conflict gets a line saying so.',
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
    run: (state, args, note) => get(state.index, strings(args, 'ids'), note),
  },
  {
    definition: {
      name: 'kb_quick_answers',
      title: 'Quick answers',
      description:
        "claude-kb's most-asked questions, each with a one-line answer and its entry IDs: on using Claude and Claude" +
        " Code, or for one topic together with that topic's recommendations for our setup; topic stack has the" +
        ' questions on the stack Claude works on.',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            ...TOPIC,
            description: `${TOPIC.description}, or ${STACK_TOPIC} for the stack's rows; leave out for the Claude rows`,
          },
        },
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

export function hitLine(entry: Entry, today: Date, conflicted = false): string {
  const merged = entry.mergedInto.length ? `, merged into ${entry.mergedInto.join(', ')}` : '';
  const conflict = conflicted ? ', open conflict: kb_get says which' : '';
  return (
    `${entry.id}: ${entry.title} (${entry.type}, ${entry.confidence}, last verified ${entry.lastVerified}` +
    `${age(entry, today)}${merged}${conflict})`
  );
}

/** An entry's text, then a line for each open INDEX.md conflict that names it. */
function withConflicts(index: Index, entry: Entry): string {
  const lines = (index.conflicts.get(entry.id) ?? []).map(c => `Conflict (INDEX.md): ${c.topic} — ${c.supported}`);
  return lines.length ? `${entry.body}\n\n${lines.join('\n')}` : entry.body;
}

/** The filters kb_search accepts, besides the topic */
export interface SearchFilters {
  topic?: string;
  type?: string;
  confidence?: string;
  appliesTo?: string;
  limit?: number;
}

function resolveChoice(name: string, value: string | undefined, allowed: string[]): string | undefined {
  const wanted = value?.trim() || undefined;
  if (wanted && !allowed.includes(wanted)) {
    throw new ToolError(
      `Unknown ${name} ${JSON.stringify(value)}. Pass one of: ${allowed.join(', ')}; or leave it out.`,
    );
  }
  return wanted;
}

export function search(
  index: Index | undefined,
  query: string,
  { topic, type, confidence, appliesTo, limit = LIMIT.default }: SearchFilters = {},
  note: Note = () => {},
): string {
  const kb = loaded(index);
  if (!query.trim()) throw new ToolError('Pass a query: some words, a phrase, or entry IDs such as MCP-017.');
  if (limit < LIMIT.min || limit > LIMIT.max) {
    throw new ToolError(`Pass a limit from ${LIMIT.min} to ${LIMIT.max} (default ${LIMIT.default}).`);
  }
  const wantedType = resolveChoice('type', type, TYPES);
  const wantedConfidence = resolveChoice('confidence', confidence, CONFIDENCE);
  const wantedApplies = resolveChoice('applies_to', appliesTo, APPLIES_TO);
  const name = resolveTopic(kb, topic);
  const hits = kb.search(query, {
    topic: name,
    type: wantedType,
    confidence: wantedConfidence,
    appliesTo: wantedApplies,
    limit,
  });
  note({ ids: hits.map(h => h.entry.id) });
  if (!hits.length) {
    searchEmpty.inc();
    const filters = Object.entries({
      topic: name,
      type: wantedType,
      confidence: wantedConfidence,
      applies_to: wantedApplies,
    })
      .filter(([, v]) => v)
      .map(([k, v]) => `${k} ${v}`);
    const where = filters.length ? ` with ${filters.join(', ')}` : '';
    return (
      `No entries match ${JSON.stringify(query)}${where}. Try other words${filters.length ? ' or fewer filters' : ''}, or` +
      ` kb_quick_answers for a topic's most-asked` +
      ` questions. Topics:\n${topicList(kb)}\n\n${corpus(kb)}`
    );
  }
  const today = new Date();
  const blocks: [string, string][] = hits.map(h => [
    h.entry.id,
    `${hitLine(h.entry, today, kb.conflicts.has(h.entry.id))}\n${h.entry.summary}`,
  ]);
  const kept = fit(blocks, MAX_CHARS.search, '\n\n', 'hits', 'lower the limit or narrow the query');
  return [...kept, corpus(kb)].join('\n\n');
}

export function get(index: Index | undefined, ids: string[], note: Note = () => {}): string {
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
  note({ ids: entries.map(e => e.id), unknown: notes.length });
  if (!entries.length) throw new ToolError(notes.join('\n'));
  const blocks = fit(
    entries.map(e => [e.id, withConflicts(kb, e)]),
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
  // The stack's rows are INDEX.md's second table, left out of the no-topic answer: with the Claude rows they came to
  // 35,660 characters on 2026-10-23, about 9,000 tokens
  const stack = kb.quickAnswers.get(STACK_TOPIC);
  if (stack !== undefined && topic?.trim().toLowerCase() === STACK_TOPIC && !kb.topics.has(STACK_TOPIC)) {
    return `# The stack Claude works on: Quick answers\n\n${stack}\n\n${corpus(kb)}`;
  }
  const name = resolveTopic(kb, topic);
  if (name === undefined) {
    const table = kb.quickAnswers.get(INDEX_TOPIC) ?? '';
    const stackLine =
      stack === undefined ? '' : `The stack Claude works on (one row per stack topic): pass topic ${STACK_TOPIC}.\n`;
    return (
      `# Quick answers on using Claude\n\n${table}\n\n${stackLine}` +
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
