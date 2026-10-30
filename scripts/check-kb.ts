/**
 * Check every topics/kb-*.md file against the entry format in CLAUDE.md, ENTRIES.md against the topic files' index
 * tables, and INDEX.md, OVERLAPS.md and CHANGELOG.md against the entries.
 *
 * Usage: node scripts/check-kb.ts [--write]
 * --write regenerates ENTRIES.md from the topic files' index tables and fills the entry counts in INDEX.md's file table
 * first. Without it, a stale ENTRIES.md or a wrong count is a problem.
 * Exits with status 1 when it finds a problem, so it can run in CI. Possible duplicates across files and long Done
 * recommendations are printed as warnings and never fail the run.
 *
 * Node built-ins only (Node 22.18 or later runs the .ts directly): research sessions run it without an `npm install`.
 */
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SequenceMatcher } from './difflib.ts';
import {
  APPLIES_TO,
  CONFIDENCE,
  entries,
  escapeRegExp,
  FIELDS,
  HEADING,
  indexTable,
  MERGED_SUFFIX,
  META_LINE,
  readText,
  section,
  topicTitle,
  WORD_CHAR,
  words,
} from './kb-parse.ts';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// The word limit of an entry's text (CLAUDE.md asks for 50-250 and allows up to this).
const MAX_WORDS = 300;
// Entries that are syntheses of other entries and cite IDs instead of URLs.
const SYNTHESIS_SOURCE = /synthesis of/i;
// Possible duplicates across files: titles this similar (difflib ratio), or this share of tags (Jaccard, at least 2).
const TITLE_SIMILAR = 0.72;
const TAGS_SHARED = 0.6;
// A done recommendation is cut to one line (CLAUDE.md); decisions keep their reason, so longer ones only warn.
const DONE_CHARS = 300;
const DONE_ITEM = /^(?:\d+\.|-) (?:\*\*)?Done\b.*$/gm;
// Sections where IDs on one line count as already reviewed together.
const REVIEWED_SECTIONS: Record<string, string[]> = {
  'INDEX.md': ['Conflicts'],
  'OVERLAPS.md': ['Resolved conflicts', 'Overlaps kept on purpose', 'Merges', 'Similar but distinct'],
};
// Files that name entry IDs, checked for IDs that don't exist.
const ID_FILES = ['INDEX.md', 'OVERLAPS.md', 'CHANGELOG.md'];
// An ID with a word boundary on each side
const ID = `(?<!${WORD_CHAR})[A-Z]+-\\d+(?!${WORD_CHAR})`;
const ID_RANGE = new RegExp(`(?<!${WORD_CHAR})([A-Z]+)-(\\d+) to (?:[A-Z]+-)?(\\d+)(?!${WORD_CHAR})`, 'gu');
const ENTRIES_HEADER = `# Entries

Every entry by ID, title, type and tags, one table per topic file. Generated from the topic files' index tables by
\`node scripts/check-kb.ts --write\`: don't edit it by hand. Grep it rather than reading it whole:

\`\`\`bash
grep -i -E 'webfetch|curl' ENTRIES.md
\`\`\`

Then read only the entries you need: \`grep -n '^## \\[TOK-036\\]' topics/kb-*.md\` gives the file and line. Start at
[INDEX.md](INDEX.md) for Quick answers and Conflicts.

Merged entries keep their ID and a pointer, so old references still resolve.
`;

type Texts = Map<string, string>;

function countEntries(text: string): number {
  return [...entries(text)].length;
}

function quickAnswerRows(text: string): number | undefined {
  const body = section(text, 'Quick answers');
  if (body === undefined) return undefined;
  const rows = body.split('\n').filter(l => l.startsWith('|'));
  return Math.max(rows.length - 2, 0); // minus header and separator
}

/** The prefix of a topic file's entries, from its first entry. */
function topicPrefix(text: string): string {
  const first = entries(text).next();
  return first.done ? '' : first.value[0].split('-')[0];
}

export function buildEntries(texts: Texts): string {
  const parts = [ENTRIES_HEADER];
  for (const [name, t] of texts) {
    const prefix = topicPrefix(t);
    const rows = indexTable(t)
      .map(([eid, title, kind, tags]) => `| ${eid} | ${title} | ${kind} | ${tags} |`)
      .join('\n');
    parts.push(
      `## ${topicTitle(t)} (\`topics/${name}\`, ${prefix})\n\n| ID | Title | Type | Tags |\n|---|---|---|---|\n${rows}\n`,
    );
  }
  return parts.join('\n');
}

/** Pairs of IDs named on the same line (ranges like X-001 to X-005 expanded) in the REVIEWED_SECTIONS. */
function reviewedPairs(others: Texts): Set<string> {
  const pairs = new Set<string>();
  for (const [file, names] of Object.entries(REVIEWED_SECTIONS)) {
    for (const name of names) {
      for (const line of (section(others.get(file) ?? '', name) ?? '').split('\n')) {
        const ids = new Set(line.match(new RegExp(ID, 'gu')) ?? []);
        for (const [, prefix, start, end] of line.matchAll(ID_RANGE)) {
          for (let n = Number(start); n <= Number(end); n++) {
            ids.add(`${prefix}-${String(n).padStart(start.length, '0')}`);
          }
        }
        const list = [...ids];
        list.forEach((a, i) => list.slice(i + 1).forEach(b => pairs.add(pairKey(a, b))));
      }
    }
  }
  return pairs;
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a} ${b}` : `${b} ${a}`;
}

/** Warnings, not failures: cross-file entry pairs with near-identical titles or mostly shared tags. */
function possibleDuplicates(texts: Texts, reviewed: Set<string>): string[] {
  const titles = new Map<string, [string, string]>();
  const tags = new Map<string, Set<string>>();
  for (const [name, t] of texts) {
    for (const m of t.matchAll(HEADING)) titles.set(m[1], [name, m[2].trim()]);
    for (const [eid, , , tagText] of indexTable(t)) {
      tags.set(
        eid,
        new Set(
          tagText
            .split(',')
            .map(tag => tag.trim())
            .filter(Boolean),
        ),
      );
    }
  }
  // Each title lowercased, split into code points and indexed once: about 160,000 pairs are compared
  const lower = new Map([...titles].map(([id, [, title]]) => [id, Array.from(title.toLowerCase())]));
  const matchers = new Map([...titles].map(([id, [, title]]) => [id, new SequenceMatcher(title.toLowerCase())]));
  const similar = (a: string, b: string) => {
    const [chars, matcher] = [lower.get(a)!, matchers.get(b)!];
    // The cheap upper bounds first: they rule out all but about 1 pair in 15, and never a similar one
    return (
      matcher.realQuickRatio(chars) >= TITLE_SIMILAR &&
      matcher.quickRatio(chars) >= TITLE_SIMILAR &&
      matcher.ratio(chars) >= TITLE_SIMILAR
    );
  };
  const found: string[] = [];
  const ids = [...titles.keys()].sort();
  for (const [i, a] of ids.entries()) {
    for (const b of ids.slice(i + 1)) {
      const [fileA, titleA] = titles.get(a)!;
      const [fileB, titleB] = titles.get(b)!;
      if (fileA === fileB || reviewed.has(pairKey(a, b))) continue;
      const tagsA = tags.get(a) ?? new Set();
      const tagsB = tags.get(b) ?? new Set();
      const shared = [...tagsA].filter(t => tagsB.has(t)).length;
      const union = new Set([...tagsA, ...tagsB]).size;
      if ((shared >= 2 && shared / union >= TAGS_SHARED) || similar(a, b)) {
        found.push(`${a} '${titleA}' and ${b} '${titleB}'`);
      }
    }
  }
  return found;
}

/** Warnings, not failures: Done recommendations longer than DONE_CHARS, as `file rec N: length`. */
function longDoneItems(texts: Texts): string[] {
  const found: string[] = [];
  for (const [name, t] of texts) {
    for (const [line] of (section(t, 'Recommendations for our setup') ?? '').matchAll(DONE_ITEM)) {
      if (line.length <= DONE_CHARS) continue;
      const label = line.startsWith('- ') ? line.slice(2, 40) : line.split('.')[0];
      found.push(`${name} recommendation ${label}: ${line.length} characters`);
    }
  }
  return found;
}

function field(body: string, pattern: string): string | undefined {
  return new RegExp(`^- ${pattern}`, 'm').exec(body)?.[1];
}

/** Some of APPLIES_TO joined by ', ', each at most once and in the order of APPLIES_TO. */
function validAppliesTo(value: string): boolean {
  const indexes = value.split(', ').map(v => APPLIES_TO.indexOf(v));
  return indexes.every((at, i) => at >= 0 && (i === 0 || at > indexes[i - 1]));
}

function checkTopic(t: string, where: Map<string, string[]>): string[] {
  const issues: string[] = [];
  for (const name of ['Quick answers', 'Index', 'Recommendations for our setup', 'Open questions']) {
    if (!new RegExp(`^#{2,3} .*${escapeRegExp(name)}`, 'mi').test(t)) issues.push(`missing section: ${name}`);
  }
  const rows = quickAnswerRows(t);
  if (rows !== undefined && !(rows >= 10 && rows <= 15)) issues.push(`Quick answers has ${rows} rows (want 10-15)`);

  // The file's own index table must list exactly its entries, under their heading's title.
  const headings = new Map([...t.matchAll(HEADING)].map(m => [m[1], m[2].trim()]));
  const listed = new Map(indexTable(t).map(([eid, name]) => [eid, name]));
  for (const eid of headings.keys()) if (!listed.has(eid)) issues.push(`${eid} is missing from the file's index`);
  for (const eid of listed.keys()) {
    if (!headings.has(eid)) issues.push(`the file's index lists ${eid}, which has no entry here`);
  }
  for (const [eid, name] of listed) {
    const heading = headings.get(eid);
    if (heading !== undefined && name.replace(MERGED_SUFFIX, '') !== heading) {
      issues.push(`${eid}: index title '${name}' differs from the heading '${heading}'`);
    }
  }

  for (const [eid, body] of entries(t)) {
    for (const name of FIELDS) {
      if (!new RegExp(`^- ${name}:`, 'm').test(body)) issues.push(`${eid}: missing field ${name}`);
    }
    const confidence = field(body, 'Confidence:[ \\t]*(.+)$');
    if (confidence !== undefined && !CONFIDENCE.includes(confidence.trim())) {
      issues.push(`${eid}: Confidence '${confidence.trim()}' is not one of the allowed values`);
    }
    const applies = field(body, 'Applies to:[ \\t]*(.*)$');
    if (applies !== undefined && !validAppliesTo(applies)) {
      issues.push(
        `${eid}: Applies to '${applies}' is not ${APPLIES_TO.join(', ')} (some, joined by ', ' in that order)`,
      );
    }
    const verified = field(body, 'Last verified:[ \\t]*(\\S+)');
    if (verified !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(verified)) {
      issues.push(`${eid}: Last verified '${verified}' is not YYYY-MM-DD`);
    }
    const sources = field(body, 'Sources:[ \\t]*(.+)$');
    if (sources !== undefined && !sources.includes('http') && !SYNTHESIS_SOURCE.test(sources)) {
      issues.push(`${eid}: Sources has no URL`);
    }
    const related = field(body, 'Related:[ \\t]*(.+)$');
    for (const [ref] of related?.matchAll(/[A-Z]+-\d+/g) ?? []) {
      if (!where.has(ref)) issues.push(`${eid}: Related points to unknown ${ref}`);
    }
    const prose = body.replace(META_LINE, '').replace(/```[\s\S]*?```/g, '');
    const count = words(prose).length;
    if (count > MAX_WORDS && !SYNTHESIS_SOURCE.test(sources ?? '')) {
      issues.push(`${eid}: about ${count} words (want at most ${MAX_WORDS})`);
    }
  }
  return issues;
}

// A row of INDEX.md's file table: [row up to the count, file name, prefix, count cell, rest of the row]
const FILE_ROW = /^(\| `topics\/(kb-[\p{L}\p{N}_-]+\.md)` \| ([A-Z]+) \| .*? \| )([^|]*)( \|)$/gmu;

/** The count cell of a topic file's row in INDEX.md's file table: its entries, and how many of them are merged. */
function fileTableCount(text: string): string {
  const merged = indexTable(text).filter(([, title]) => MERGED_SUFFIX.test(title)).length;
  return `${countEntries(text)} (${merged} merged into other entries)`;
}

/** INDEX.md with the count cell of each topic file's row set to the file's current counts. */
export function fillFileTable(indexMd: string, texts: Texts): string {
  return indexMd.replace(FILE_ROW, (row, head: string, name: string, _prefix, _count, tail: string) => {
    const t = texts.get(name);
    return t === undefined ? row : `${head}${fileTableCount(t)}${tail}`;
  });
}

/** README.md's Layout table against the topic files: each is listed, under the prefix its entries use. */
function checkReadme(readme: string, texts: Texts): string[] {
  const issues: string[] = [];
  const rows = new Map(
    [...readme.matchAll(/^\| \[(kb-[\p{L}\p{N}_-]+\.md)\]\(topics\/\1\) \| `([A-Z]+)` \|/gmu)].map(m => [m[1], m[2]]),
  );
  for (const [name, t] of texts) {
    const prefix = rows.get(name);
    if (prefix === undefined) issues.push(`topics/${name} is missing from README.md's Layout table`);
    else if (prefix !== topicPrefix(t)) {
      issues.push(
        `README.md's Layout table gives prefix ${prefix} for topics/${name}, its entries use ${topicPrefix(t)}`,
      );
    }
  }
  return issues;
}

/** INDEX.md's file table against the topic files, and the entry IDs INDEX.md, OVERLAPS.md and CHANGELOG.md name. */
function checkIndex(indexMd: string, others: Texts, texts: Texts, where: Map<string, string[]>): string[] {
  const issues: string[] = [];
  // Prefixes come from the entries themselves, so a new topic file is checked without editing this script.
  const prefixes = [...new Set([...where.keys()].map(eid => eid.split('-')[0]))].sort().join('|');
  const mention = new RegExp(`(?<!${WORD_CHAR})(?:${prefixes})-\\d+(?!${WORD_CHAR})`, 'gu');
  for (const [name, text] of others) {
    const mentioned = [...new Set(text.match(mention) ?? [])].sort();
    for (const ref of mentioned) if (!where.has(ref)) issues.push(`${name} mentions unknown ${ref}`);
  }
  // The file table at the top: every topic file listed, with its current entry count.
  const table = new Map([...indexMd.matchAll(FILE_ROW)].map(m => [m[2], m[4]]));
  for (const [name, t] of texts) {
    const want = fileTableCount(t);
    if (!table.has(name)) issues.push(`topics/${name} is missing from the file table`);
    else if (table.get(name) !== want) {
      issues.push(
        `file table says '${table.get(name)}' for topics/${name}, want '${want}': run node scripts/check-kb.ts --write`,
      );
    }
  }
  return issues;
}

export function main(root: string, write = false): number {
  const topics = join(root, 'topics');
  const files = readdirSync(topics)
    .filter(f => /^kb-.*\.md$/s.test(f))
    .sort();
  if (!files.length) {
    console.log('No topics/kb-*.md files found.');
    return 1;
  }
  const texts: Texts = new Map(files.map(f => [f, readText(join(topics, f))]));
  const where = new Map<string, string[]>();
  for (const [name, t] of texts) {
    for (const [eid] of entries(t)) where.set(eid, [...(where.get(eid) ?? []), name]);
  }

  let problems = 0;
  for (const [name, t] of texts) {
    const issues = checkTopic(t, where);
    console.log(`topics/${name}: ${countEntries(t)} entries, ${issues.length} issue(s)`);
    for (const issue of issues) console.log(`  - ${issue}`);
    problems += issues.length;
  }

  const entriesFile = join(root, 'ENTRIES.md');
  const generated = buildEntries(texts);
  if (write) {
    writeFileSync(entriesFile, generated, 'utf8');
    console.log('ENTRIES.md: written');
  } else if (!existsSync(entriesFile) || readText(entriesFile) !== generated) {
    console.log("ENTRIES.md: out of date with the topic files' index tables; run node scripts/check-kb.ts --write");
    problems += 1;
  } else {
    console.log('ENTRIES.md: up to date');
  }

  const indexFile = join(root, 'INDEX.md');
  if (write && existsSync(indexFile)) {
    writeFileSync(indexFile, fillFileTable(readText(indexFile), texts), 'utf8');
    console.log("INDEX.md: file table's entry counts written");
  }

  const others: Texts = new Map(ID_FILES.filter(n => existsSync(join(root, n))).map(n => [n, readText(join(root, n))]));
  const indexMd = others.get('INDEX.md');
  if (indexMd !== undefined) {
    const issues = checkIndex(indexMd, others, texts, where);
    console.log(`INDEX.md: ${issues.length} issue(s)`);
    for (const issue of issues) console.log(`  - ${issue}`);
    problems += issues.length;

    const warnings = possibleDuplicates(texts, reviewedPairs(others));
    if (warnings.length) {
      console.log(
        `\nPossible duplicates across files (${warnings.length}, warnings only). Merge or cross-link them,` +
          " or list the pair under 'Similar but distinct' in OVERLAPS.md:",
      );
      for (const w of warnings) console.log(`  - ${w}`);
    }
  }

  const longDone = longDoneItems(texts);
  if (longDone.length) {
    console.log(
      `\nLong Done recommendations (${longDone.length}, warnings only). Cut each to one line, unless it's a decision` +
        ' that keeps its reason:',
    );
    for (const w of longDone) console.log(`  - ${w}`);
  }

  const readmeFile = join(root, 'README.md');
  if (existsSync(readmeFile)) {
    const issues = checkReadme(readText(readmeFile), texts);
    console.log(`README.md: ${issues.length} issue(s)`);
    for (const issue of issues) console.log(`  - ${issue}`);
    problems += issues.length;
  }

  for (const [eid, names] of [...where].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    if (names.length > 1) {
      console.log(`duplicate ID ${eid} in ${names.join(', ')}`);
      problems += 1;
    }
  }

  console.log(problems ? `\n${problems} issue(s) in total` : '\nAll files pass.');
  return problems ? 1 : 0;
}

if (import.meta.filename === process.argv[1]) process.exitCode = main(ROOT, process.argv.slice(2).includes('--write'));
