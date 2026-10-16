/** The four tools through the SDK's client, in process, on this repo's index: results, errors and size caps. */
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import type { Client } from '@modelcontextprotocol/client';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';
import { type Index, load } from '../kb-index.ts';
import { hitLine, MAX_CHARS, pyRepr, SEPARATOR, TYPES } from '../kb-tools.ts';
import { KbState } from '../server.ts';
import { callTool, collectLogs, mcpClient, REPO, tempDir } from './helpers.ts';

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
  const search = tools[0].description!;
  expect(search).toContain('kb_get the 1 to 4 best IDs');
  expect(search).toContain('60 days');
  // claude.ai's "Always allow" is reported to be keyed on the descriptions' hash (anthropics/claude-ai-mcp#1087):
  // these are the Python server's, line breaks included. Change one only on purpose.
  const hashes = tools.map(t => createHash('sha256').update(`${t.title}\n${t.description}`).digest('hex').slice(0, 12));
  expect(hashes).toEqual(['69cd66bf52e4', '8009679f722b', '7ed2cb6763ad', '868e29499dfe']);
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
    expect(text.startsWith("No entries match 'zzqqxx'")).toBe(true);
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
    [{ query: 'hooks', topic: 'nope' }, "Unknown topic 'nope'"],
    [{ query: 'hooks', type: 'opinion' }, "Unknown type 'opinion'"],
  ])('bad arguments: %j', async (args, message) => {
    const { text, isError } = await call('kb_search', args);
    expect(isError).toBe(true);
    expect(text).toContain(message);
  });

  test.each(['subagent model effort', 'prompt caching', 'mcp server oauth connector', 'hooks', 'skills description trigger'])(
    'stays under 4 KB: %s',
    async query => {
      const { text } = await call('kb_search', { query });
      expect(hitIds(text)).toHaveLength(8);
      expect(Buffer.byteLength(text)).toBeLessThan(4096);
    },
  );
});

test('stale entries say so', () => {
  const entry = index.entries.get('MCP-017')!;
  const today = new Date('2026-12-31T12:00:00Z');
  expect(hitLine({ ...entry, lastVerified: '2026-11-15' }, today)).not.toContain('check its sources');
  expect(hitLine({ ...entry, lastVerified: '2026-10-01' }, today)).toContain(
    'last verified 2026-10-01, 91 days ago: check its sources',
  );
});

test("Python's repr() in the error texts", () => {
  expect(pyRepr('nope')).toBe("'nope'");
  expect(pyRepr("it's")).toBe('"it\'s"');
  expect(pyRepr('a\'b"c\\')).toBe("'a\\'b\"c\\\\'");
  expect(pyRepr('a\nb\t\x01 🙂')).toBe("'a\\nb\\t\\x01\\xa0🙂'");
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
    expect(text).toContain('\nMCP-999: no such entry. Closest: MCP-');
    expect(text).toContain('\nwebfetch: no such entry. Closest: TOK-');
    expect(text.endsWith(CORPUS)).toBe(true);
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
  test('across the knowledge base', async () => {
    const { text, isError } = await call('kb_quick_answers');
    expect(isError).toBe(false);
    expect(text.startsWith('# Quick answers across the knowledge base\n\n')).toBe(true);
    expect(text).toContain('| Which model should a reviewer use? |');
    expect(text).toContain('- mcp (MCP): ');
    expect(text.endsWith(CORPUS)).toBe(true);
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
