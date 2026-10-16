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
  test('passes', () => {
    const { status, output } = check(REPO);
    expect(output).toContain('ENTRIES.md: up to date');
    expect(output.endsWith('All files pass.')).toBe(true);
    expect(status).toBe(0);
  });

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
- Applies to: general
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
      'topics/kb-alpha.md: 3 entries, 13 issue(s)',
      "  - ALP-003 is missing from the file's index",
      "  - the file's index lists ALP-004, which has no entry here",
      "  - ALP-002: index title 'A different title' differs from the heading 'Gadget pricing'",
      "  - ALP-002: Confidence 'probably' is not one of the allowed values",
      "  - ALP-002: Last verified '15' is not YYYY-MM-DD",
      '  - ALP-002: Sources has no URL',
      '  - ALP-002: Related points to unknown ZZZ-009',
      '  - ALP-002: about 324 words (want 50-250)',
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
      '  - file table says 2 entries for topics/kb-alpha.md, the file has 3',
      '  - topics/kb-beta.md is missing from the file table',
      '',
      "Possible duplicates across files (1, warnings only). Merge or cross-link them, or list the pair under 'Similar but distinct' in OVERLAPS.md:",
      "  - ALP-001 'Widgets rotate clockwise' and BET-001 'Widgets rotate clockwise!'",
      'duplicate ID ALP-003 in kb-alpha.md, kb-beta.md',
      '',
      '21 issue(s) in total',
    ]);
  });

  test('--write regenerates ENTRIES.md', () => {
    const { output } = check(fixture(), true);
    expect(output).toContain('ENTRIES.md: written');
    const entries = readText(join(root, 'ENTRIES.md'));
    expect(entries).toContain('`node scripts/check-kb.ts --write`');
    expect(entries).toContain(
      '## Alpha (`topics/kb-alpha.md`, ALP)\n\n| ID | Title | Type | Tags |\n|---|---|---|---|\n',
    );
    expect(entries).toContain('| BET-001 | Widgets rotate clockwise! | fact | widgets, rotation |\n');
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
