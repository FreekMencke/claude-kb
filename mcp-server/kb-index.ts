/**
 * The knowledge base as an immutable, searchable index: entries parsed by ../scripts/kb-parse.ts, searched with
 * SQLite FTS5.
 *
 * `load(root)` reads `root/topics/kb-*.md` and `root/INDEX.md` from a checkout and returns an `Index`. Nothing changes
 * an Index after it's built: the server builds a new one when git-sync moves to a new commit and swaps it in, so a
 * request never sees half of one (FreekMencke/claude-kb#111).
 *
 * Search is Node's built-in `node:sqlite` with FTS5 and bm25(), in memory: no search package.
 */
import { existsSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { DatabaseSync, type StatementSync } from 'node:sqlite';
import {
  entries as parseEntries,
  HEADING,
  indexTable,
  MERGED_SUFFIX,
  META_LINE,
  readText,
  section,
  topicTitle,
  WORD_CHAR,
  words,
} from '../scripts/kb-parse.ts';

export const INDEX_TOPIC = 'index';
// Column weights for bm25(), in the FTS table's column order: id, title, tags, body. Tuned on tests/kb-index.test.ts's
// Quick-answer questions; on 2026-10-15, 208 of all 253 Quick-answer questions found a cited entry in the top 5.
const WEIGHTS = [10, 3, 2, 1];
export const SUMMARY_CHARS = 300;
const ID_IN_QUERY = new RegExp(`(?<!${WORD_CHAR})([A-Za-z]+-\\d+)(?!${WORD_CHAR})`, 'gu');
const WORD = new RegExp(`${WORD_CHAR}+`, 'gu');
// Question words that match nearly every entry; left out so an OR query ranks on the words that carry meaning
const STOPWORDS = new Set(
  (
    'a an and are as at be by can do does for from how i in is it its my of on or should so that the this to was what' +
    ' when where which who why will with you your'
  ).split(' '),
);

export interface Entry {
  readonly id: string;
  readonly title: string;
  readonly topic: string;
  readonly file: string;
  readonly type: string;
  readonly appliesTo: string;
  readonly confidence: string;
  readonly lastVerified: string;
  readonly sources: string;
  readonly related: readonly string[];
  readonly tags: readonly string[];
  /** The IDs a merged entry points to; empty for every other entry */
  readonly mergedInto: readonly string[];
  readonly summary: string;
  readonly body: string;
}

export interface Hit {
  readonly entry: Entry;
  /** True when the query named this entry's ID */
  readonly byId: boolean;
}

export interface SearchOptions {
  topic?: string;
  type?: string;
  limit?: number;
}

export class Index {
  readonly commit: string;
  readonly builtAt: Date;
  readonly buildSeconds: number;
  readonly entries: ReadonlyMap<string, Entry>;
  /** Topic file titles by topic ("mcp" for topics/kb-mcp.md) */
  readonly topics: ReadonlyMap<string, string>;
  /** Each topic's ID prefix ("MCP" for "mcp") */
  readonly prefixes: ReadonlyMap<string, string>;
  /** The "Quick answers" section by topic, INDEX_TOPIC for INDEX.md's */
  readonly quickAnswers: ReadonlyMap<string, string>;
  readonly recommendations: ReadonlyMap<string, string>;
  readonly #match: StatementSync;
  readonly #matchAll: StatementSync;
  /** The searchable entries by FTS rowid: the table is contentless, so it holds no IDs */
  readonly #rows: readonly Entry[];

  constructor(fields: Omit<Index, 'get' | 'topic' | 'search'>, db: DatabaseSync, rows: readonly Entry[]) {
    this.commit = fields.commit;
    this.builtAt = fields.builtAt;
    this.buildSeconds = fields.buildSeconds;
    this.entries = fields.entries;
    this.topics = fields.topics;
    this.prefixes = fields.prefixes;
    this.quickAnswers = fields.quickAnswers;
    this.recommendations = fields.recommendations;
    const sql = `SELECT rowid FROM fts WHERE fts MATCH ? ORDER BY bm25(fts, ${WEIGHTS.join(', ')})`;
    this.#match = db.prepare(`${sql} LIMIT ?`);
    // With a topic or type, filtered here: bm25 scores every match to sort them anyway, so the LIMIT saves little
    this.#matchAll = db.prepare(sql);
    this.#rows = rows;
  }

  /**
   * The entries with these IDs, in the order asked, skipping unknown ones and repeats. Any case, and the number padded
   * to three digits: "mcp-17" is MCP-017.
   */
  get(ids: Iterable<string>): Entry[] {
    const found = new Map<string, Entry>();
    for (const id of ids) {
      const entry = this.entries.get(normalId(id));
      if (entry && !found.has(entry.id)) found.set(entry.id, entry);
    }
    return [...found.values()];
  }

  /** The topic for "mcp", "kb-mcp", "kb-mcp.md" or the prefix "MCP"; undefined for anything else. */
  topic(name: string): string | undefined {
    const topic = name
      .trim()
      .toLowerCase()
      .replace(/\.md$/, '')
      .replace(/^topics\//, '')
      .replace(/^kb-/, '');
    if (this.topics.has(topic)) return topic;
    const prefix = topic.toUpperCase();
    for (const [t, p] of this.prefixes) if (p === prefix) return t;
    return undefined;
  }

  /**
   * Entries for a query, best first: entries whose IDs the query names, then entries matching any of its words, ranked
   * by bm25() (an entry matching more of them ranks higher). Merged entries are found by ID only. `topic` and `type`
   * filter every result; an unknown topic matches nothing.
   */
  search(query: string, { topic, type, limit = 8 }: SearchOptions = {}): Hit[] {
    const wantedTopic = topic ? this.topic(topic) : undefined;
    if (topic && wantedTopic === undefined) return [];
    const keep = (e: Entry) => (wantedTopic === undefined || e.topic === wantedTopic) && (!type || e.type === type);

    const ids = [...query.matchAll(ID_IN_QUERY)].map(m => m[1]);
    const hits = new Map(
      this.get(ids)
        .filter(keep)
        .map(e => [e.id, { entry: e, byId: true }]),
    );
    // OR, not FTS5's implicit AND: a question's words rarely all appear in the entry that answers it. Matching all
    // words first and then any word ranked worse on the Quick-answer questions.
    const queryPhrases = phrases(query);
    if (hits.size < limit && queryPhrases.length) {
      const match = queryPhrases.join(' OR ');
      const filtered = wantedTopic !== undefined || type;
      const rows = filtered ? this.#matchAll.all(match) : this.#match.all(match, limit + hits.size);
      for (const row of rows) {
        const entry = this.#rows[(row.rowid as number) - 1];
        if (!hits.has(entry.id) && keep(entry)) hits.set(entry.id, { entry, byId: false });
        if (hits.size >= limit) break;
      }
    }
    return [...hits.values()].slice(0, limit);
  }
}

export function normalId(id: string): string {
  const m = /^\s*([A-Za-z]+)-(\d+)\s*$/.exec(id);
  return m ? `${m[1].toUpperCase()}-${m[2].replace(/^0+(?=\d)/, '').padStart(3, '0')}` : id.trim().toUpperCase();
}

/**
 * Each whitespace-separated part of the query as a quoted FTS5 phrase of its words, so `(`, `-` or `"` in a query
 * never reach MATCH as syntax: "mcp-json" becomes the phrase "mcp json". Lone stopwords are dropped.
 */
function phrases(query: string): string[] {
  const found = new Set<string>();
  for (const part of words(query)) {
    const partWords = (part.match(WORD) ?? []).map(w => w.toLowerCase());
    if (partWords.length && !(partWords.length === 1 && STOPWORDS.has(partWords[0]))) {
      found.add(`"${partWords.join(' ')}"`);
    }
  }
  return [...found];
}

function field(body: string, name: string): string {
  const m = new RegExp(`^- ${name}:[ \\t]*(.*)$`, 'm').exec(body);
  return m ? m[1].trim() : '';
}

/** The entry without its heading and metadata lines. */
function prose(body: string): string {
  const newline = body.indexOf('\n');
  return (newline === -1 ? '' : body.slice(newline + 1)).replace(META_LINE, '').trim();
}

/**
 * The first paragraph (with the next ones while it's under a third of SUMMARY_CHARS, so a lead-in such as "Default
 * TTLs:" keeps its list), cut at the last sentence end within SUMMARY_CHARS, or at a word with an ellipsis.
 */
export function summary(text: string): string {
  let para = '';
  for (const part of text.split('\n\n')) {
    para = `${para} ${words(part).join(' ')}`.trim();
    if (para.length >= SUMMARY_CHARS / 3) break;
  }
  if (para.length <= SUMMARY_CHARS) return para;
  // Not half an emoji: a cut between a surrogate pair's halves would leave invalid UTF-16
  const cut = para.slice(0, SUMMARY_CHARS).replace(/[\uD800-\uDBFF]$/, '');
  // A sentence ends at a full stop and a space: words() made every space, a no-break one too, a plain one
  const end = cut.lastIndexOf('. ');
  if (end > SUMMARY_CHARS / 3) return cut.slice(0, end + 1);
  const space = cut.lastIndexOf(' ');
  return `${space === -1 ? cut : cut.slice(0, space)} …`;
}

function mergedInto(indexTitle: string): string[] {
  const m = MERGED_SUFFIX.exec(indexTitle);
  return m ? (m[0].match(/[A-Z]+-\d+/g) ?? []) : [];
}

/**
 * Parse and index the checkout at `root`. `commit` defaults to the directory's name, which is the commit hash for a
 * git-sync worktree.
 */
export function load(root: string, commit?: string): Index {
  const started = performance.now();
  const entries = new Map<string, Entry>();
  const topics = new Map<string, string>();
  const prefixes = new Map<string, string>();
  const quickAnswers = new Map<string, string>();
  const recommendations = new Map<string, string>();
  const db = new DatabaseSync(':memory:');
  // Porter stemming, so "reviewers" finds "reviewer". Contentless: the entries are in memory already, so the table
  // keeps only its index (0.9 instead of 2.2 MiB on 2026-10-16), and rowid N is rows[N - 1]
  db.exec("CREATE VIRTUAL TABLE fts USING fts5(id, title, tags, body, tokenize = 'porter unicode61', content = '')");
  const insert = db.prepare('INSERT INTO fts (rowid, id, title, tags, body) VALUES (?, ?, ?, ?, ?)');
  const rows: Entry[] = [];
  const files = readdirSync(join(root, 'topics'))
    .filter(f => /^kb-.*\.md$/s.test(f))
    .sort();
  for (const file of files) {
    const text = readText(join(root, 'topics', file));
    const topic = file.slice('kb-'.length, -'.md'.length);
    topics.set(topic, topicTitle(text));
    for (const [name, store] of [
      ['Quick answers', quickAnswers],
      ['Recommendations for our setup', recommendations],
    ] as const) {
      const body = section(text, name);
      if (body !== undefined) store.set(topic, body.trim());
    }
    const listed = new Map(indexTable(text).map(([id, title, , tags]) => [id, [title, tags]]));
    const titles = new Map([...text.matchAll(HEADING)].map(m => [m[1], m[2].trim()]));
    for (const [id, body] of parseEntries(text)) {
      const [indexTitle, tagText] = listed.get(id) ?? ['', ''];
      const entryProse = prose(body);
      const entry: Entry = {
        id,
        title: titles.get(id) ?? '',
        topic,
        file: `topics/${file}`,
        type: field(body, 'Type'),
        appliesTo: field(body, 'Applies to'),
        confidence: field(body, 'Confidence'),
        lastVerified: field(body, 'Last verified'),
        sources: field(body, 'Sources'),
        related: field(body, 'Related').match(/[A-Z]+-\d+/g) ?? [],
        tags: tagText
          .split(',')
          .map(t => t.trim())
          .filter(Boolean),
        mergedInto: mergedInto(indexTitle),
        summary: summary(entryProse),
        body: body.trim(),
      };
      entries.set(id, entry);
      if (!prefixes.has(topic)) prefixes.set(topic, id.split('-')[0]);
      // A merged entry is a pointer: found by its ID, never in place of the entry it points to
      if (!entry.mergedInto.length) {
        rows.push(entry);
        insert.run(rows.length, id, entry.title, entry.tags.join(' '), entryProse);
      }
    }
  }
  const indexMd = join(root, 'INDEX.md');
  const quick = existsSync(indexMd) ? section(readText(indexMd), 'Quick answers') : undefined;
  if (quick) quickAnswers.set(INDEX_TOPIC, quick.trim());
  return new Index(
    {
      commit: commit || basename(root),
      builtAt: new Date(),
      buildSeconds: (performance.now() - started) / 1000,
      entries,
      topics,
      prefixes,
      quickAnswers,
      recommendations,
    },
    db,
    rows,
  );
}
