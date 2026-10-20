/** kb-index: parsing a checkout into entries, and searching them, on fixture files and on this repo. */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, test } from 'vitest';
import { entries as parseEntries, readText } from '../../scripts/kb-parse.ts';
import { type Hit, type Index, INDEX_TOPIC, load, SUMMARY_CHARS, summary } from '../kb-index.ts';
import { REPO, tempDir } from './helpers.ts';

const ALPHA = `# Alpha things (ALP)

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| How do widgets rotate? | Clockwise. | ALP-001 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| ALP-001 | Widgets rotate clockwise | fact | widgets, rotation |
| ALP-002 | Gadget pricing | recommendation | gadgets, pricing-model |
| ALP-003 | Old widget notes (merged into ALP-001) | fact | widgets |

## [ALP-001] Widgets rotate clockwise
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-15
- Sources: [Widget docs](https://example.com/widgets)
- Related: ALP-002, BET-001

A widget always turns clockwise when seen from above. The spindle sets the direction.

Second paragraph about gearing.

### A subheading inside the entry

Still part of ALP-001.

## [ALP-002] Gadget pricing
- Type: recommendation
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-14
- Sources: [Gadget blog](https://example.com/gadgets)
- Related: none

Gadgets cost more in winter (bid-ask spread).

## [ALP-003] Old widget notes
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Widget docs](https://example.com/widgets)
- Related: ALP-001

Merged into ALP-001 (kb-alpha.md) on 2026-10-12. Widgets widgets widgets.

## Recommendations for our setup

1. Buy gadgets in summer (ALP-002).

## Open questions

- Do widgets rotate on the moon?
`;

const BETA = `# Beta (BET)

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| BET-001 | Widget storage | fact | widgets |

## [BET-001] Widget storage
- Type: fact
- Applies to: general
- Confidence: unverified
- Last verified: 2026-10-15
- Sources: [Storage](https://example.com/storage)
- Related: ALP-001

Store widgets dry.
`;

const EMPTY = `# Empty (EMP)

## Quick answers

Nothing yet.
`;

const INDEX = `# Index

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Where do widgets go? | Somewhere dry. | BET-001 |

## Conflicts
`;

function fixtureIndex(): Index {
  const root = join(tempDir(), '0123abc');
  mkdirSync(join(root, 'topics'), { recursive: true });
  for (const [name, text] of Object.entries({ 'kb-alpha.md': ALPHA, 'kb-beta.md': BETA, 'kb-empty.md': EMPTY })) {
    writeFileSync(join(root, 'topics', name), text, 'utf8');
  }
  writeFileSync(join(root, 'INDEX.md'), INDEX, 'utf8');
  return load(root);
}

function ids(hits: Hit[]): string[] {
  return hits.map(h => h.entry.id);
}

describe('fixture files', () => {
  let index: Index;
  beforeAll(() => {
    index = fixtureIndex();
  });

  test('parses every field', () => {
    const e = index.entries.get('ALP-001')!;
    expect([e.title, e.topic, e.file]).toEqual(['Widgets rotate clockwise', 'alpha', 'topics/kb-alpha.md']);
    expect([e.type, e.appliesTo, e.confidence]).toEqual(['fact', 'Claude Code', 'official-docs']);
    expect(e.lastVerified).toBe('2026-10-15');
    expect(e.sources).toBe('[Widget docs](https://example.com/widgets)');
    expect(e.related).toEqual(['ALP-002', 'BET-001']);
    expect(e.tags).toEqual(['widgets', 'rotation']);
    expect(e.mergedInto).toEqual([]);
    // The first paragraph is short, so the summary goes on into the second
    expect(e.summary).toBe(
      'A widget always turns clockwise when seen from above. The spindle sets the direction.' +
        ' Second paragraph about gearing.',
    );
    expect(e.body.startsWith('## [ALP-001] Widgets rotate clockwise\n- Type: fact')).toBe(true);
    expect(e.body.endsWith('Still part of ALP-001.')).toBe(true);
    expect(index.entries.get('ALP-002')!.related).toEqual([]);
  });

  test('a merged entry keeps its pointer and is found by ID only', () => {
    const merged = index.entries.get('ALP-003')!;
    expect(merged.mergedInto).toEqual(['ALP-001']);
    expect(merged.summary.startsWith('Merged into ALP-001')).toBe(true);
    expect(ids(index.search('old widget notes'))).not.toContain('ALP-003');
    expect(ids(index.search('ALP-003'))[0]).toBe('ALP-003');
  });

  test('a file with no entries, and INDEX.md', () => {
    expect([...index.entries.keys()].sort()).toEqual(['ALP-001', 'ALP-002', 'ALP-003', 'BET-001']);
    expect(Object.fromEntries(index.topics)).toEqual({ alpha: 'Alpha things', beta: 'Beta', empty: 'Empty' });
    expect(index.quickAnswers.get('empty')).toBe('Nothing yet.');
    expect(index.quickAnswers.has('beta')).toBe(false);
    expect(index.quickAnswers.get(INDEX_TOPIC)).toContain('| Where do widgets go? |');
    expect(index.quickAnswers.get(INDEX_TOPIC)).not.toContain('Conflicts');
    expect(Object.fromEntries(index.recommendations)).toEqual({ alpha: '1. Buy gadgets in summer (ALP-002).' });
  });

  test('commit and build time', () => {
    expect(index.commit).toBe('0123abc');
    expect(index.buildSeconds).toBeGreaterThanOrEqual(0);
    expect(index.builtAt).toBeInstanceOf(Date);
  });

  test('a long summary is cut at a sentence', () => {
    const cut = summary('This sentence has exactly fifty characters in it.. '.repeat(10));
    expect(cut.length).toBeLessThanOrEqual(SUMMARY_CHARS);
    expect(cut.endsWith('.')).toBe(true);
    expect(summary('word '.repeat(100)).endsWith(' …')).toBe(true);
    // Never half an emoji
    expect(summary(`a${'🙂'.repeat(400)}`)).toBe(`a${'🙂'.repeat((SUMMARY_CHARS - 2) / 2)} …`);
  });

  test('get: any case, in order, without repeats', () => {
    expect(index.get(['bet-001', 'ALP-001', 'BET-001', 'NOPE-1']).map(e => e.id)).toEqual(['BET-001', 'ALP-001']);
  });

  test('IDs come first, then words', () => {
    const hits = index.search('BET-001 gadget');
    expect(ids(hits).slice(0, 2)).toEqual(['BET-001', 'ALP-002']);
    expect(hits.slice(0, 2).map(h => h.byId)).toEqual([true, false]);
  });

  test('stemming and tags', () => {
    expect(ids(index.search('rotating'))[0]).toBe('ALP-001');
    expect(ids(index.search('pricing-model'))[0]).toBe('ALP-002');
  });

  test('filters', () => {
    expect(ids(index.search('widgets', { topic: 'beta' }))).toEqual(['BET-001']);
    expect(ids(index.search('widgets', { topic: 'BET' }))).toEqual(['BET-001']);
    expect(ids(index.search('widgets', { topic: 'kb-beta.md' }))).toEqual(['BET-001']);
    expect(ids(index.search('widgets', { topic: 'nope' }))).toEqual([]);
    expect(ids(index.search('widgets gadgets', { type: 'recommendation' }))).toEqual(['ALP-002']);
    expect(ids(index.search('ALP-001', { topic: 'beta' }))).toEqual([]);
  });

  test.each(['(', '-', '"', 'widget (spindle', 'bid-ask "spread', 'AND OR NOT', 'NEAR(', 'col:x'])(
    'FTS5 syntax in a query never throws: %s',
    query => {
      expect(() => index.search(query)).not.toThrow();
    },
  );

  test('stopwords only find nothing', () => {
    expect(index.search('what is the')).toEqual([]);
  });
});

describe('this repo', () => {
  let repo: Index;
  beforeAll(() => {
    repo = load(REPO, 'worktree');
  });
  const topicFiles = readdirSync(join(REPO, 'topics')).filter(f => /^kb-.*\.md$/.test(f));

  test('the entry count matches the parser', () => {
    const counted = topicFiles.flatMap(f => [...parseEntries(readText(join(REPO, 'topics', f)))].map(([id]) => id));
    expect(repo.entries.size).toBe(counted.length);
    expect(new Set(counted).size).toBe(counted.length);
    expect(counted.length).toBeGreaterThanOrEqual(566); // on 2026-10-15
    expect([...repo.topics.keys()].sort()).toEqual(topicFiles.map(f => f.slice(3, -3)).sort());
    expect(repo.quickAnswers.has(INDEX_TOPIC)).toBe(true);
  });

  test('every entry has its fields', () => {
    for (const e of repo.entries.values()) {
      expect(e.title && e.type && e.confidence && e.summary && e.tags.length, e.id).toBeTruthy();
      expect(e.lastVerified, e.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  test.each([
    ['MCP-017', ['MCP-017']],
    ['mcp-017', ['MCP-017']],
    ['MCP-017, tok-005 SKILL-005', ['MCP-017', 'TOK-005', 'SKILL-005']],
    ['Installation scopes and which definition wins', ['MCP-001']],
    ['headers-helper', ['MCP-007']],
  ])('search %s finds %j first', (query, first) => {
    expect(ids(repo.search(query)).slice(0, first.length)).toEqual(first);
  });

  test('the topic filter', () => {
    const hits = repo.search('hooks permissions (deny) -- settings', { topic: 'mcp' });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every(h => h.entry.topic === 'mcp')).toBe(true);
  });

  // Ten questions from INDEX.md's Quick answers, each with an entry its row cites. Anthropic's mcp-builder skill asks
  // for ten such evaluation questions.
  test.each([
    ['Which model should a reviewer use?', 'ORCH-030'],
    ['Subagents, agent view, agent teams or workflows?', 'ORCH-001'],
    ['How big is the fixed overhead, and how do I see what fills my context?', 'TOK-002'],
    ['How many research subagents, and what should they return?', 'TOK-099'],
    ['What loads at launch, what loads later, and what survives `/compact`?', 'MEM-003'],
    ['Skill, CLAUDE.md, hook, subagent or MCP?', 'SKILL-021'],
    ['Can a hook pull `main` before Claude Code makes a worktree?', 'SESS-036'],
    ['How do I write a hook that blocks something, and what does it cost?', 'HOOK-013'],
    ['Is a read-only MCP server enough to keep an agent read-only on AWS or Kubernetes?', 'INFRA-004'],
    ['What must my server do to work as a claude.ai custom connector?', 'MCP-029'],
  ])('%s finds %s in the top 5', (question, cited) => {
    expect(ids(repo.search(question, { limit: 5 }))).toContain(cited);
  });

  test('most Quick-answer questions find a cited entry in the top 5', () => {
    // Every Quick-answer row in the repo: at least 75% find one of their cited entries in the top 5 (82% on
    // 2026-10-15, 208 of 253). A drop means a search change made ranking worse.
    const rows = [...repo.quickAnswers.values()].flatMap(text =>
      text.split('\n').flatMap(line => {
        const cells = line
          .replace(/^\|+|\|+$/g, '')
          .split('|')
          .map(c => c.trim());
        return cells.length >= 3 && /^[A-Z]+-\d+/.test(cells.at(-1)!)
          ? [[cells[0], new Set(cells.at(-1)!.match(/[A-Z]+-\d+/g))] as const]
          : [];
      }),
    );
    const found = rows.filter(([q, cited]) => ids(repo.search(q, { limit: 5 })).some(id => cited.has(id))).length;
    expect(rows.length).toBeGreaterThanOrEqual(200);
    expect(found / rows.length, `${found} of ${rows.length}`).toBeGreaterThanOrEqual(0.75);
  });

  // The questions above use the entries' own words. evals/retrieval/questions.json rewords 100 of them (RETR-010):
  // natural in free wording, hard describing the situation without the entries' terms. Raw-question search found a
  // cited entry in the top 5 for 90 natural and 73 hard on 2026-10-20; a ranking change that drops either fails here.
  // kb-knowledge-retrieval.md quotes these questions, so its entries don't count.
  test.each([
    ['natural', 0.85],
    ['hard', 0.65],
  ] as const)('most %s rewordings of Quick-answer questions find a cited entry in the top 5', (set, floor) => {
    const questions: { natural: string; hard: string; cited: string[] }[] = JSON.parse(
      readFileSync(join(REPO, 'evals/retrieval/questions.json'), 'utf8'),
    );
    const top5 = (q: string) =>
      ids(repo.search(q, { limit: 30 }))
        .filter(id => !id.startsWith('RETR-'))
        .slice(0, 5);
    const found = questions.filter(q => top5(q[set]).some(id => q.cited.includes(id))).length;
    expect(questions.length).toBe(100);
    expect(found / questions.length, `${found} of ${questions.length}`).toBeGreaterThanOrEqual(floor);
  });
});
