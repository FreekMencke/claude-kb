/** The KB format checker (../scripts/check-kb.ts) on this repo and on a broken fixture, and its difflib port. */
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { buildEntries, main } from '../../scripts/check-kb.ts';
import { ratio, SequenceMatcher } from '../../scripts/difflib.ts';
import { readText } from '../../scripts/kb-parse.ts';
import { REPO, tempDir } from './helpers.ts';

/** The checker's exit status and what it printed. */
function check(root: string, write = false): { status: number; output: string } {
  const lines: string[] = [];
  const log = vi.spyOn(console, 'log').mockImplementation((line: string) => void lines.push(line));
  try {
    return { status: main(root, write), output: lines.join('\n') };
  } finally {
    log.mockRestore();
  }
}

describe('this repo', () => {
  // The similar-titles pass compares every pair of titles: 5.9 s at 1,258 entries on 2026-10-30, over vitest's 5 s
  test('passes', () => {
    const { status, output } = check(REPO);
    expect(output).toContain('ENTRIES.md: up to date');
    expect(output.endsWith('All files pass.')).toBe(true);
    expect(status).toBe(0);
  }, 30_000);

  test('ENTRIES.md regenerates unchanged', () => {
    const topics = readdirSync(join(REPO, 'topics'))
      .filter(f => /^kb-.*\.md$/.test(f))
      .sort();
    const texts = new Map(topics.map(f => [f, readText(join(REPO, 'topics', f))]));
    expect(buildEntries(texts)).toBe(readText(join(REPO, 'ENTRIES.md')));
  });
});

const QUICK = `## Quick answers

| Question | Answer | Entries |
|---|---|---|
${Array.from({ length: 10 }, (_, i) => `| Q${i}? | A. | ALP-001 |`).join('\n')}
`;
const BODY = 'Words. '.repeat(20);
const ALPHA = `# Alpha (ALP)

${QUICK}
## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| ALP-001 | Widgets rotate clockwise | fact | widgets, rotation, spindles |
| ALP-002 | A different title | fact | gadgets |
| ALP-004 | Not here | fact | gadgets |

## [ALP-001] Widgets rotate clockwise
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-15
- Sources: [Docs](https://example.com)
- Related: BET-001

${BODY}

## [ALP-002] Gadget pricing
- Type: fact
- Applies to: general, Claude Code
- Confidence: probably
- Last verified: 15 October
- Sources: a blog post
- Related: ZZZ-009

${'word '.repeat(320)}

## [ALP-003] Missing fields
- Type: fact

${BODY}

## Recommendations for our setup

1. None.

## Open questions

- None.
`;
const BETA = `# Beta (BET)

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| BET-001 | Widgets rotate clockwise! | fact | widgets, rotation |
| ALP-003 | Missing fields | fact | widgets |

## [BET-001] Widgets rotate clockwise!
- Type: fact
- Applies to: general
- Confidence: unverified
- Last verified: 2026-10-15
- Sources: [Docs](https://example.com)
- Related: ALP-001

${BODY}

## [ALP-003] Missing fields
- Type: fact
- Applies to: general
- Confidence: unverified
- Last verified: 2026-10-15
- Sources: [Docs](https://example.com)
- Related: none

${BODY}
`;
const INDEX = `# Index

| File | Prefix | Topic | Entries |
|---|---|---|---|
| \`topics/kb-alpha.md\` | ALP | Alpha | 2 |

Mentions ALP-001 and NOPE-001, and BET-099.
`;

describe('a broken fixture', () => {
  let root: string;
  afterEach(() => vi.restoreAllMocks());

  function fixture(): string {
    root = tempDir();
    mkdirSync(join(root, 'topics'));
    writeFileSync(join(root, 'topics', 'kb-alpha.md'), ALPHA, 'utf8');
    writeFileSync(join(root, 'topics', 'kb-beta.md'), BETA, 'utf8');
    writeFileSync(join(root, 'INDEX.md'), INDEX, 'utf8');
    return root;
  }

  // The output of the Python checker, check_kb.py, on the same files (2026-10-16), but for the command it names
  test('fails with the expected messages', () => {
    const { status, output } = check(fixture());
    expect(status).toBe(1);
    expect(output.split('\n')).toEqual([
      'topics/kb-alpha.md: 3 entries, 14 issue(s)',
      "  - ALP-003 is missing from the file's index",
      "  - the file's index lists ALP-004, which has no entry here",
      "  - ALP-002: index title 'A different title' differs from the heading 'Gadget pricing'",
      "  - ALP-002: Confidence 'probably' is not one of the allowed values",
      "  - ALP-002: Applies to 'general, Claude Code' is not Claude Code, Claude API, claude.ai, general (some, joined by ', ' in that order)",
      "  - ALP-002: Last verified '15' is not YYYY-MM-DD",
      '  - ALP-002: Sources has no URL',
      '  - ALP-002: Related points to unknown ZZZ-009',
      '  - ALP-002: about 324 words (want at most 300)',
      '  - ALP-003: missing field Applies to',
      '  - ALP-003: missing field Confidence',
      '  - ALP-003: missing field Last verified',
      '  - ALP-003: missing field Sources',
      '  - ALP-003: missing field Related',
      'topics/kb-beta.md: 2 entries, 3 issue(s)',
      '  - missing section: Quick answers',
      '  - missing section: Recommendations for our setup',
      '  - missing section: Open questions',
      "ENTRIES.md: out of date with the topic files' index tables; run node scripts/check-kb.ts --write",
      'INDEX.md: 3 issue(s)',
      '  - INDEX.md mentions unknown BET-099',
      "  - file table says '2' for topics/kb-alpha.md, want '3 (0 merged into other entries)': run node scripts/check-kb.ts --write",
      '  - topics/kb-beta.md is missing from the file table',
      '',
      "Possible duplicates across files (1, warnings only). Merge or cross-link them, or list the pair under 'Similar but distinct' in OVERLAPS.md:",
      "  - ALP-001 'Widgets rotate clockwise' and BET-001 'Widgets rotate clockwise!'",
      'duplicate ID ALP-003 in kb-alpha.md, kb-beta.md',
      '',
      '22 issue(s) in total',
    ]);
  });

  test('--write regenerates ENTRIES.md and fills the file table, leaving the rest of INDEX.md', () => {
    const { output } = check(fixture(), true);
    expect(output).toContain('ENTRIES.md: written');
    const entries = readText(join(root, 'ENTRIES.md'));
    expect(entries).toContain('`node scripts/check-kb.ts --write`');
    expect(entries).toContain(
      '## Alpha (`topics/kb-alpha.md`, ALP)\n\n| ID | Title | Type | Tags |\n|---|---|---|---|\n',
    );
    expect(entries).toContain('| BET-001 | Widgets rotate clockwise! | fact | widgets, rotation |\n');
    expect(readText(join(root, 'INDEX.md'))).toBe(
      INDEX.replace('| Alpha | 2 |', '| Alpha | 3 (0 merged into other entries) |'),
    );
  });
});

/** A topic file that passes every check, with these entries' `Applies to` values and index titles. */
function goodTopic(prefix: string, entries: [applies: string, titleSuffix?: string][]): string {
  const rows = entries.map(
    ([, suffix = ''], i) => `| ${prefix}-00${i + 1} | Title ${i + 1}${suffix} | fact | tag${i} |`,
  );
  const bodies = entries.map(
    ([applies], i) => `## [${prefix}-00${i + 1}] Title ${i + 1}
- Type: fact
- Applies to: ${applies}
- Confidence: unverified
- Last verified: 2026-10-23
- Sources: [Docs](https://example.com)
- Related: none

${BODY}
`,
  );
  const quick = QUICK.replaceAll('ALP-001', `${prefix}-001`);
  return `# Topic (${prefix})

${quick}
## Index

| ID | Title | Type | Tags |
|---|---|---|---|
${rows.join('\n')}

${bodies.join('\n')}
## Recommendations for our setup

1. None.

## Open questions

- None.
`;
}

const GOOD_INDEX = (cell: string) => `# Index

| File | Prefix | Topic | Entries |
|---|---|---|---|
| \`topics/kb-good.md\` | GOO | Good | ${cell} |
`;
const GOOD_README = (row: string) => `# Readme

## Layout

| Topic file | Prefix | Covers |
|---|---|---|
${row}
`;
const GOOD_ROW = '| [kb-good.md](topics/kb-good.md) | `GOO` | Good |';

describe('a fixture with one valid topic file', () => {
  /** The checker's result on that file, with INDEX.md's count cell and a README's Layout row (none when undefined). */
  function run(applies: string[], cell: string, readmeRow?: string, write = false) {
    const root = tempDir();
    mkdirSync(join(root, 'topics'));
    writeFileSync(
      join(root, 'topics', 'kb-good.md'),
      goodTopic(
        'GOO',
        applies.map(a => [a]),
      ),
      'utf8',
    );
    writeFileSync(join(root, 'INDEX.md'), GOOD_INDEX(cell), 'utf8');
    if (readmeRow !== undefined) writeFileSync(join(root, 'README.md'), GOOD_README(readmeRow), 'utf8');
    check(root, true); // ENTRIES.md, so only the checks under test can fail
    writeFileSync(join(root, 'INDEX.md'), GOOD_INDEX(cell), 'utf8');
    return { root, ...check(root, write) };
  }
  afterEach(() => vi.restoreAllMocks());

  test('passes', () => {
    const { status, output } = run(['Claude Code'], '1 (0 merged into other entries)', GOOD_ROW);
    expect(output.endsWith('All files pass.')).toBe(true);
    expect(status).toBe(0);
  });

  test.each([
    'general',
    'Claude Code',
    'Claude API',
    'claude.ai',
    'Claude Code, Claude API',
    'Claude Code, claude.ai',
    'Claude Code, Claude API, claude.ai',
    'Claude API, general',
    'Claude Code, Claude API, claude.ai, general',
  ])('Applies to %j is valid', applies => {
    expect(run([applies], '1 (0 merged into other entries)').status).toBe(0);
  });

  test.each([
    'Claude API, Claude Code',
    'claude.ai, Claude Code',
    'general, Claude Code',
    'Claude Code, Claude Code',
    'Claude API (Agent SDK)',
    'Claude Code, Claude API (when tool search is off)',
    'claude code',
    'Claude Code,',
    'Claude Code,Claude API',
    'Claude Code ,Claude API',
    'Claude Code,  Claude API',
    '',
    'Claude Code Claude API',
    'Gemini',
  ])('Applies to %j fails', applies => {
    const { status, output } = run([applies], '1 (0 merged into other entries)');
    expect(status).toBe(1);
    expect(output).toContain(`GOO-001: Applies to '${applies}' is not Claude Code, Claude API, claude.ai, general`);
  });

  test('an empty Applies to is reported as empty, not as the next line', () => {
    const { output } = run([''], '1 (0 merged into other entries)');
    expect(output).toContain("GOO-001: Applies to '' is not");
    expect(output).not.toContain('- Confidence');
  });

  test('every entry is checked, not only the first', () => {
    const { output } = run(['Claude Code', 'general, claude.ai'], '2 (0 merged into other entries)');
    expect(output).toContain("GOO-002: Applies to 'general, claude.ai'");
    expect(output).not.toContain('GOO-001: Applies to');
  });

  test('the word limit is 300, and the message says so', () => {
    const root = tempDir();
    mkdirSync(join(root, 'topics'));
    const topic = goodTopic('GOO', [['general']]);
    // The heading's four words count too
    writeFileSync(join(root, 'topics', 'kb-good.md'), topic.replace(BODY, 'word '.repeat(297)), 'utf8');
    expect(check(root).output).toContain('GOO-001: about 301 words (want at most 300)');
    writeFileSync(join(root, 'topics', 'kb-good.md'), topic.replace(BODY, 'word '.repeat(296)), 'utf8');
    expect(check(root).output).not.toContain('words');
  });

  test('a Done recommendation over 300 characters warns, without failing', () => {
    const root = tempDir();
    mkdirSync(join(root, 'topics'));
    const topic = goodTopic('GOO', [['general']]);
    const done = (n: number, chars: number) => {
      const head = `${n}. Done 2026-10-23: `;
      return head + 'x'.repeat(chars - head.length);
    };
    const recs = `1. None.\n${done(2, 301)}\n${done(3, 300)}\n4. **Done 2026-10-23:** ${'y'.repeat(300)}`;
    writeFileSync(join(root, 'topics', 'kb-good.md'), topic.replace('1. None.', recs), 'utf8');
    check(root, true);
    const { status, output } = check(root);
    expect(output).toContain('Long Done recommendations (2, warnings only)');
    expect(output).toContain('kb-good.md recommendation 2: 301 characters');
    expect(output).not.toContain('recommendation 3:');
    expect(output).toContain('kb-good.md recommendation 4:');
    expect(status).toBe(0);
  });

  test("a topic file missing from README.md's Layout table fails, a wrong prefix too", () => {
    const missing = run(
      ['general'],
      '1 (0 merged into other entries)',
      '| [kb-other.md](topics/kb-other.md) | `OTH` | Other |',
    );
    expect(missing.status).toBe(1);
    expect(missing.output).toContain("topics/kb-good.md is missing from README.md's Layout table");
    const wrong = run(['general'], '1 (0 merged into other entries)', GOOD_ROW.replace('`GOO`', '`GOD`'));
    expect(wrong.output).toContain(
      "README.md's Layout table gives prefix GOD for topics/kb-good.md, its entries use GOO",
    );
  });

  test('a wrong count in INDEX.md fails, and --write fixes it without touching the rest', () => {
    const wrong = run(['general'], '7 (2 merged into other entries)', GOOD_ROW);
    expect(wrong.status).toBe(1);
    expect(wrong.output).toContain(
      "file table says '7 (2 merged into other entries)' for topics/kb-good.md, want '1 (0 merged into other entries)'",
    );
    const fixed = run(['general'], '7 (2 merged into other entries)', GOOD_ROW, true);
    expect(fixed.status).toBe(0);
    expect(fixed.output).toContain("INDEX.md: file table's entry counts written");
    expect(readText(join(fixed.root, 'INDEX.md'))).toBe(GOOD_INDEX('1 (0 merged into other entries)'));
  });

  test.each(['TBD', '', '-', '0'])('a placeholder count cell %j is a wrong count, and --write fills it', cell => {
    const want = '1 (0 merged into other entries)';
    const wrong = run(['general'], cell, GOOD_ROW);
    expect(wrong.status).toBe(1);
    expect(wrong.output).toContain(`file table says '${cell}' for topics/kb-good.md, want '${want}'`);
    expect(wrong.output).not.toContain('is missing from the file table');
    const fixed = run(['general'], cell, GOOD_ROW, true);
    expect(fixed.status).toBe(0);
    expect(readText(join(fixed.root, 'INDEX.md'))).toBe(GOOD_INDEX(want));
  });

  test('--write fills a bare count, and counts merged entries from the index titles', () => {
    const root = tempDir();
    mkdirSync(join(root, 'topics'));
    const topic = goodTopic('GOO', [['general'], ['general', ' (merged into GOO-001)']]);
    writeFileSync(join(root, 'topics', 'kb-good.md'), topic, 'utf8');
    writeFileSync(join(root, 'INDEX.md'), GOOD_INDEX('0'), 'utf8');
    expect(check(root, true).status).toBe(0);
    expect(readText(join(root, 'INDEX.md'))).toBe(GOOD_INDEX('2 (1 merged into other entries)'));
  });

  test('--write leaves a topic file without a row to the check', () => {
    const root = tempDir();
    mkdirSync(join(root, 'topics'));
    writeFileSync(join(root, 'topics', 'kb-good.md'), goodTopic('GOO', [['general']]), 'utf8');
    writeFileSync(
      join(root, 'INDEX.md'),
      GOOD_INDEX('1 (0 merged into other entries)').replace('GOO', 'GXX').replace('kb-good', 'kb-gxx'),
      'utf8',
    );
    const { status, output } = check(root, true);
    expect(status).toBe(1);
    expect(output).toContain('topics/kb-good.md is missing from the file table');
  });
});

// Values from Python 3.12's difflib on 2026-10-16, which the checker was written against
describe('the difflib port', () => {
  test.each([
    ['widgets rotate clockwise', 'widgets rotate clockwise!', 0.979591836735],
    ['cli, skill or mcp server?', 'what a research subagent brief adds', 0.2],
    ['', '', 1],
  ])('ratio(%j, %j)', (a, b, expected) => {
    expect(ratio(a, b)).toBeCloseTo(expected, 12);
  });

  test.each([
    ['widgets rotate clockwise', 'widgets rotate clockwise!', 0.979591836735, 0.979591836735],
    ['cli, skill or mcp server?', 'what a research subagent brief adds', 0.833333333333, 0.433333333333],
    // Past the checker's 0.72 on both bounds, but not on ratio (0.29)
    ['which model for a reviewer', 'reviewer subagent model choice', 0.928571428571, 0.75],
  ])('the upper bounds for (%j, %j)', (a, b, realQuick, quick) => {
    const matcher = new SequenceMatcher(b);
    expect(matcher.realQuickRatio(Array.from(a))).toBeCloseTo(realQuick, 12);
    expect(matcher.quickRatio(Array.from(a))).toBeCloseTo(quick, 12);
  });

  test('autojunk: a 200+ character b drops its popular characters, which only extend a match', () => {
    const a = 'ab'.repeat(150);
    // Nothing left to match on, but an empty match at the start extends over equal characters
    expect(ratio(a, a)).toBe(1);
    expect(ratio(`x${a}`, a)).toBe(0);
  });
});
