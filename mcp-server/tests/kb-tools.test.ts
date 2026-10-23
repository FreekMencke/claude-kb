/** The four tools through the SDK's client, over HTTP, on this repo's index: results, errors and size caps. */
import { join } from 'node:path';
import type { Client } from '@modelcontextprotocol/client';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';
import { APPLIES_TO, CONFIDENCE } from '../../scripts/kb-parse.ts';
import { type Index, load } from '../kb-index.ts';
import { get, hitLine, INSTRUCTIONS, MAX_CHARS, quickAnswers, search, SEPARATOR, TYPES } from '../kb-tools.ts';
import { KbState } from '../server.ts';
import { callTool, collectLogs, fixtureIndex, INDEX, mcpClient, REPO, tempDir } from './helpers.ts';

const COMMIT = 'testcommit';
const CORPUS = `corpus: ${COMMIT}`;

let index: Index;
let client: Client;

beforeAll(async () => {
  index = load(REPO, COMMIT);
  const state = new KbState(REPO, collectLogs().logger);
  state.index = index;
  client = await mcpClient(state);
});
afterAll(() => client.close());

function call(tool: string, args: Record<string, unknown> = {}) {
  return callTool(client, tool, args);
}

function hitIds(text: string): string[] {
  return [...text.matchAll(new RegExp(`^([A-Z]+-\\d{3}): .* \\((?:${TYPES.join('|')}), `, 'gm'))].map(m => m[1]);
}

test('tools/list', async () => {
  const { tools } = await client.listTools();
  expect(tools.map(t => t.name)).toEqual(['kb_search', 'kb_get', 'kb_quick_answers', 'kb_status']);
  for (const tool of tools) {
    expect(tool.title && tool.description).toBeTruthy();
    expect(tool.annotations?.readOnlyHint).toBe(true);
    expect(tool.annotations?.destructiveHint).toBe(false);
    expect(tool.outputSchema).toBeUndefined();
  }
  const description = tools[0].description!;
  expect(description).toContain('kb_get the 1 to 4 best IDs');
  expect(description).toContain('60 days');
  expect(description).toContain('knowledge retrieval and RAG');
  expect(description).toContain('data visualisation and charts');
  expect(description).toContain('Filter by topic, type, confidence or applies_to');
  expect(INSTRUCTIONS).toContain('knowledge retrieval and RAG');
  expect(INSTRUCTIONS).toContain('data visualisation');
  expect(INSTRUCTIONS).toContain('confidence and applies_to');
  expect(Object.keys((tools[0].inputSchema as { properties: object }).properties)).toEqual([
    'query',
    'topic',
    'type',
    'confidence',
    'applies_to',
    'limit',
  ]);
});

describe('kb_search', () => {
  test('by ID', async () => {
    const { text, isError } = await call('kb_search', { query: 'mcp-017' });
    expect(isError).toBe(false);
    expect(text.startsWith('MCP-017: CLI, skill or MCP server? (comparison, official-docs, last verified ')).toBe(true);
    expect(text.endsWith(CORPUS)).toBe(true);
  });

  test('a phrase, and a topic', async () => {
    expect(hitIds((await call('kb_search', { query: 'Installation scopes and which definition wins' })).text)[0]).toBe(
      'MCP-001',
    );
    const ids = hitIds((await call('kb_search', { query: 'hooks (deny) -- settings', topic: 'MCP', limit: 5 })).text);
    expect(ids).toHaveLength(5);
    expect(ids.every(i => i.startsWith('MCP-'))).toBe(true);
  });

  test('no hits lists the topics', async () => {
    const { text, isError } = await call('kb_search', { query: 'zzqqxx' });
    expect(isError).toBe(false);
    expect(text.startsWith('No entries match "zzqqxx"')).toBe(true);
    expect(text).toContain('- mcp (MCP): ');
    expect(text.endsWith(CORPUS)).toBe(true);
  });

  test('a null topic or type counts as none', async () => {
    const { text, isError } = await call('kb_search', { query: 'MCP-017', topic: null, type: null });
    expect(isError).toBe(false);
    expect(hitIds(text)[0]).toBe('MCP-017');
  });

  test.each([
    [{ query: '' }, 'Pass a query'],
    [{ query: '   ' }, 'Pass a query'],
    [{ query: 'hooks', limit: 0 }, 'Pass a limit from 1 to 20'],
    [{ query: 'hooks', limit: 21 }, 'Pass a limit from 1 to 20'],
    [{ query: 'hooks', topic: 'nope' }, 'Unknown topic "nope"'],
    [{ query: 'hooks', type: 'opinion' }, 'Unknown type "opinion"'],
    [{ query: 'hooks', confidence: 'certain' }, `Unknown confidence "certain". Pass one of: ${CONFIDENCE.join(', ')}`],
    [{ query: 'hooks', confidence: 'Official-Docs' }, 'Unknown confidence "Official-Docs"'],
    [{ query: 'hooks', applies_to: 'Claude' }, `Unknown applies_to "Claude". Pass one of: ${APPLIES_TO.join(', ')}`],
    [{ query: 'hooks', applies_to: 'claude code' }, 'Unknown applies_to "claude code"'],
    [{ query: 'hooks', confidence: 3 }, 'Pass confidence as a string'],
    [{ query: 5 }, 'Pass query as a string'],
    [{ query: 'hooks', limit: 2.5 }, 'Pass limit as a whole number'],
  ])('bad arguments: %j', async (args, message) => {
    const { text, isError } = await call('kb_search', args);
    expect(isError).toBe(true);
    expect(text).toContain(message);
  });

  test('the confidence filter returns only entries of that confidence', async () => {
    for (const confidence of CONFIDENCE) {
      const found = hitIds((await call('kb_search', { query: 'hooks settings models', confidence, limit: 20 })).text);
      expect(found.length, confidence).toBeGreaterThan(0);
      expect(
        found.map(id => index.entries.get(id)!.confidence),
        confidence,
      ).toEqual(found.map(() => confidence));
    }
    const { text } = await call('kb_search', { query: 'hooks', confidence: 'official-docs' });
    expect(text).not.toMatch(/\((?:fact|pattern|recommendation|anti-pattern|tool|comparison), (?!official-docs,)/);
  });

  test('the applies_to filter returns entries whose list has that value', async () => {
    for (const surface of APPLIES_TO) {
      const found = hitIds(
        (await call('kb_search', { query: 'models effort caching', applies_to: surface, limit: 20 })).text,
      );
      expect(found.length, surface).toBeGreaterThan(0);
      for (const id of found) expect(index.entries.get(id)!.appliesTo.split(', '), id).toContain(surface);
    }
  });

  test('the filters combine with the topic and type; none left is the same as null', async () => {
    const found = hitIds(
      (await call('kb_search', { query: 'hooks', topic: 'mcp', type: 'fact', confidence: 'official-docs', limit: 20 }))
        .text,
    );
    expect(found.length).toBeGreaterThan(0);
    for (const id of found) {
      const e = index.entries.get(id)!;
      expect([e.topic, e.type, e.confidence]).toEqual(['mcp', 'fact', 'official-docs']);
    }
    const plain = await call('kb_search', { query: 'MCP-017' });
    const nulls = await call('kb_search', { query: 'MCP-017', confidence: null, applies_to: '' });
    expect(nulls).toEqual(plain);
  });

  test('no hits under filters names them', async () => {
    const { text, isError } = await call('kb_search', {
      query: 'zzqqxx',
      confidence: 'unverified',
      applies_to: 'general',
    });
    expect(isError).toBe(false);
    expect(text).toContain(
      'No entries match "zzqqxx" with confidence unverified, applies_to general. Try other words or fewer filters',
    );
  });

  test.each([
    'subagent model effort',
    'prompt caching',
    'mcp server oauth connector',
    'hooks',
    'skills description trigger',
  ])('stays under 4 KB: %s', async query => {
    const { text } = await call('kb_search', { query });
    expect(hitIds(text)).toHaveLength(8);
    expect(Buffer.byteLength(text)).toBeLessThan(4096);
  });
});

test('stale entries say so', () => {
  const entry = index.entries.get('MCP-017')!;
  const today = new Date('2026-12-31T12:00:00Z');
  expect(hitLine({ ...entry, lastVerified: '2026-11-15' }, today)).not.toContain('check its sources');
  expect(hitLine({ ...entry, lastVerified: '2026-10-01' }, today)).toContain(
    'last verified 2026-10-01, 91 days ago: check its sources',
  );
});

describe('kb_get', () => {
  afterEach(() => {
    MAX_CHARS.get = 40_000;
  });

  test('one', async () => {
    const { text, isError } = await call('kb_get', { ids: ['MCP-17'] });
    expect(isError).toBe(false);
    expect(text).toBe(`${index.entries.get('MCP-017')!.body}\n\n${CORPUS}`);
  });

  test('a merged entry brings its target', async () => {
    const { text } = await call('kb_get', { ids: ['SKILL-005'] });
    expect(text.split(SEPARATOR).map(b => b.split(']')[0])).toEqual(['## [SKILL-005', '## [TOK-005']);
  });

  test('unknown next to known', async () => {
    const { text, isError } = await call('kb_get', { ids: ['MCP-017', 'MCP-999', 'webfetch'] });
    expect(isError).toBe(false);
    expect(text.startsWith('## [MCP-017]')).toBe(true);
    expect(text).toMatch(/\nMCP-999: no such entry. Closest: MCP-0\d\d \(/);
    expect(text).toContain('\nwebfetch: no such entry. Closest: TOK-');
    expect(text.endsWith(CORPUS)).toBe(true);
  });

  test('an unknown prefix lists the prefixes', async () => {
    const { text, isError } = await call('kb_get', { ids: ['ZZZ-001'] });
    expect(isError).toBe(true);
    expect(text).toMatch(/^ZZZ-001: no such entry, and no topic uses ZZZ\. Prefixes: .*\bMCP\b/);
  });

  test('only unknown is an error', async () => {
    const { text, isError } = await call('kb_get', { ids: ['MCP-999'] });
    expect(isError).toBe(true);
    expect(text.startsWith('MCP-999: no such entry. Closest: ')).toBe(true);
  });

  test.each([[[]], [['']], [Array.from({ length: 11 }, (_, n) => `MCP-${String(n + 1).padStart(3, '0')}`)]])(
    'the wrong number of IDs: %j',
    async ids => {
      const { text, isError } = await call('kb_get', { ids });
      expect(isError).toBe(true);
      expect(text).toContain('Pass 1 to 10 entry IDs, such as ["MCP-017"]');
    },
  );

  test("the ten longest stay under Claude Code's cap", async () => {
    const longest = [...index.entries.values()].sort((a, b) => b.body.length - a.body.length).slice(0, 10);
    const { text } = await call('kb_get', { ids: longest.map(e => e.id) });
    for (const e of longest) expect(text).toContain(`## [${e.id}]`);
    // 25,000 tokens is Claude Code's default cap; a token is about 4 characters of English, so this is generous
    expect(text.length).toBeLessThan(25_000 * 3);
  });

  test('says what it cut', async () => {
    MAX_CHARS.get = 3_000;
    const { text, isError } = await call('kb_get', { ids: ['MCP-001', 'MCP-002', 'MCP-003'] });
    expect(isError).toBe(false);
    expect(text.startsWith('## [MCP-001]')).toBe(true);
    expect(text).toContain('more entries cut to keep this result small: ');
    expect(text).toContain('MCP-003; kb_get them separately.)');
  });
});

describe('kb_quick_answers and kb_status', () => {
  test('without a topic: the Claude rows, the topic list and a pointer to the stack rows', async () => {
    const { text, isError } = await call('kb_quick_answers');
    expect(isError).toBe(false);
    expect(text.startsWith('# Quick answers on using Claude\n\n')).toBe(true);
    expect(text).toContain('| Which model should a reviewer use? |');
    expect(text).not.toContain('| Can Node run TypeScript directly');
    expect(text).toContain('pass topic stack.');
    expect(text).toContain('- mcp (MCP): ');
    expect(text.endsWith(CORPUS)).toBe(true);
    // 35,660 characters on 2026-10-23 with the stack rows
    expect(text.length).toBeLessThan(25_000);
  });

  test('topic stack: the stack rows, without the Claude rows', async () => {
    for (const topic of ['stack', ' Stack ']) {
      const { text, isError } = await call('kb_quick_answers', { topic });
      expect(isError).toBe(false);
      expect(text.startsWith('# The stack Claude works on: Quick answers\n\n')).toBe(true);
      expect(text).toContain('| Can Node run TypeScript directly');
      expect(text).not.toContain('| Which model should a reviewer use? |');
      expect(text.endsWith(CORPUS)).toBe(true);
    }
  });

  test('for a topic', async () => {
    const { text } = await call('kb_quick_answers', { topic: 'MCP' });
    expect(text.startsWith('# MCP servers')).toBe(true);
    expect(text).toContain('## Recommendations for our setup (these go stale faster than the facts)');
    const unknown = await call('kb_quick_answers', { topic: 'kb-nope.md' });
    expect(unknown.isError).toBe(true);
    expect(unknown.text).toContain('Unknown topic');
  });

  test('before the first sync', async () => {
    const empty = await mcpClient(new KbState(join(tempDir(), 'kb'), collectLogs().logger));
    try {
      for (const [tool, args] of [
        ['kb_search', { query: 'x' }],
        ['kb_get', { ids: ['MCP-017'] }],
        ['kb_quick_answers', {}],
      ] as const) {
        const { text, isError } = await callTool(empty, tool, args);
        expect(isError).toBe(true);
        expect(text).toContain("hasn't loaded yet");
      }
      const { text, isError } = await callTool(empty, 'kb_status');
      expect(isError).toBe(false);
      expect(text).toContain('No checkout yet');
    } finally {
      await empty.close();
    }
  });
});

describe('on fixture files', () => {
  let fixture: Index;
  beforeAll(() => {
    fixture = fixtureIndex();
  });

  test('kb_get adds a line after each entry in an open conflict, and only after those', () => {
    const [alp1, alp2, bet1] = get(fixture, ['ALP-001', 'ALP-002', 'BET-001']).split(SEPARATOR);
    expect(alp1).toMatch(
      /Still part of ALP-001\.\n\nConflict \(INDEX\.md\): Widget spin \(ALP-001, BET-001\) — ALP-001, as e\.g\. the spindle shows\. Settled in the v2\.1 docs\.\n/,
    );
    expect(
      alp1.endsWith('Conflict (INDEX.md): Widget spin, again (ALP-001) — ALP-001. The newest page wins here.'),
    ).toBe(true);
    expect(
      alp2.endsWith('\n\nConflict (INDEX.md): Gadget price (ALP-002) — Unresolved; one source. Wait for more.'),
    ).toBe(true);
    expect(bet1).toContain(
      'Conflict (INDEX.md): Widget spin (ALP-001, BET-001) — ALP-001, as e.g. the spindle shows. Settled in the v2.1 docs.',
    );
    expect(bet1).not.toContain('Gadget price');
  });

  test('a merged entry has no line itself, but the entry it points to does', () => {
    const [merged, target] = get(fixture, ['ALP-003']).split(SEPARATOR);
    expect(merged).toBe(fixture.entries.get('ALP-003')!.body);
    expect(target).toContain('## [ALP-001]');
    expect(target).toContain('\n\nConflict (INDEX.md): Widget spin (ALP-001, BET-001) — ');
  });

  test('kb_search flags the hits in a conflict', () => {
    const text = search(fixture, 'widgets gadgets');
    expect(text).toMatch(/^ALP-001: .*, open conflict: kb_get says which\)$/m);
    expect(text).toMatch(/^ALP-002: .*, open conflict: kb_get says which\)$/m);
    expect(search(fixture, 'widgets', { topic: 'beta' })).toMatch(/^BET-001: .*, open conflict: /m);
    expect(search(fixture, 'ALP-003')).not.toContain('open conflict');
  });

  test('kb_search filters on the fixture', () => {
    const found = (opts: Parameters<typeof search>[2]) =>
      [...search(fixture, 'widgets gadgets', opts).matchAll(/^([A-Z]+-\d{3}): /gm)].map(m => m[1]);
    expect(found({ confidence: 'official-docs' })).toEqual(['ALP-001']);
    expect(found({ appliesTo: 'claude.ai' })).toEqual(['BET-001']);
    expect(found({ confidence: ' single-source ', appliesTo: 'general' })).toEqual(['ALP-002']);
    expect(() => search(fixture, 'widgets', { confidence: 'sure' })).toThrow('Unknown confidence "sure"');
    expect(() => search(fixture, 'widgets', { appliesTo: 'everything' })).toThrow('Unknown applies_to "everything"');
  });

  test('quick answers without a stack table have no pointer, and topic stack is unknown', () => {
    const noStack = fixtureIndex(INDEX.replace(/### The stack[\s\S]*?(?=## Conflicts)/, ''));
    expect(noStack.quickAnswers.has('stack')).toBe(false);
    expect(quickAnswers(noStack)).not.toContain('pass topic stack');
    expect(() => quickAnswers(noStack, 'stack')).toThrow('Unknown topic "stack"');
    expect(quickAnswers(fixture)).toContain('pass topic stack.');
    expect(quickAnswers(fixture, 'stack')).toContain('| Which way does a gadget turn? |');
  });
});
