/**
 * The knowledge base's Markdown format, parsed: shared by the checker (check-kb.ts) and the MCP server's index
 * (mcp-server/kb-index.ts), so they can't drift. Node built-ins only: research sessions run the checker without an
 * `npm install`.
 *
 * Python's regular expressions were the first implementation: `\w` and `\b` match Unicode letters and digits there,
 * so WORD_CHAR stands in for them, and `PY_SPACE` is Python's whitespace for `str.split()` and `str.strip()`.
 */
import { readFileSync } from 'node:fs';

export const FIELDS = ['Type', 'Applies to', 'Confidence', 'Last verified', 'Sources', 'Related'];
export const ENTRY = /^## \[([A-Z]+-\d+)\]/gm;
export const HEADING = /^## \[([A-Z]+-\d+)\] (.+)$/gm;
export const INDEX_ROW = /^\| ([A-Z]+-\d+) \| (.*?) \| ([\p{L}\p{N}_-]+) \| (.*?) \|$/gmu;
const OTHER_HEADING = /^#{1,2} (?!\[)/gm;
export const META_LINE = new RegExp(`^- (?:${FIELDS.join('|')}):.*$`, 'gm');
// A merged entry's index row may add this to its heading's title.
export const MERGED_SUFFIX = / \(merged into [^)]*\)$/;
// A word character as Python's `\w` matches it, for word boundaries in patterns built with `u`
export const WORD_CHAR = '[\\p{L}\\p{N}_]';
const PY_SPACE = '[\\t\\n\\v\\f\\r\\x1c-\\x1f \\x85\\xa0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]';
const SPACE_RUN = new RegExp(`${PY_SPACE}+`, 'u');
const EDGE_SPACE = new RegExp(`^${PY_SPACE}+|${PY_SPACE}+$`, 'gu');

/** A file as Python's `read_text` gives it: UTF-8, with `\r\n` and `\r` read as `\n`. */
export function readText(path: string): string {
  return readFileSync(path, 'utf8').replace(/\r\n?/g, '\n');
}

/** Python's `str.split()`: the words between runs of whitespace. */
export function words(text: string): string[] {
  return text.split(SPACE_RUN).filter(Boolean);
}

/** Python's `str.strip()`. */
export function strip(text: string): string {
  return text.replace(EDGE_SPACE, '');
}

/** Python's `str.splitlines()`. */
export function splitLines(text: string): string[] {
  const lines = text.split(/\r\n|[\n\r\v\f\x1c-\x1e\x85\u2028\u2029]/);
  if (lines.at(-1) === '') lines.pop();
  return lines;
}

export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Each entry's ID and its text, from its heading to the next heading of level 1 or 2 that isn't an entry. */
export function* entries(text: string): Generator<[string, string]> {
  const heads = [...text.matchAll(ENTRY)];
  for (const [i, m] of heads.entries()) {
    const end = i + 1 < heads.length ? heads[i + 1].index : text.length;
    const body = text.slice(m.index, end);
    OTHER_HEADING.lastIndex = 3;
    const stop = OTHER_HEADING.exec(body);
    yield [m[1], stop ? body.slice(0, stop.index) : body];
  }
}

/** The text under a `## name` heading, up to the next `## ` heading; undefined without that heading. */
export function section(text: string, name: string): string | undefined {
  const m = new RegExp(`^## ${escapeRegExp(name)}\\s*$([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm').exec(text);
  return m ? m[1] : undefined;
}

/** The rows of a topic file's own index table, as [ID, title, type, tags]. */
export function indexTable(text: string): [string, string, string, string][] {
  return [...(section(text, 'Index') ?? '').matchAll(INDEX_ROW)].map(m => [m[1], m[2], m[3], m[4]]);
}

/** A topic file's title: its first line without the `#` and the `(PREFIX)` at the end. */
export function topicTitle(text: string): string {
  return strip(text.split('\n', 1)[0].replace(/^[# ]+/, '')).replace(/ \([A-Z]+\)$/, '');
}
