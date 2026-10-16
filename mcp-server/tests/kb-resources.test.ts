/** The entries as resources through the SDK's client, over HTTP, on this repo's index. */
import { join } from 'node:path';
import type { Client } from '@modelcontextprotocol/client';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { type Index, load } from '../kb-index.ts';
import { KbState } from '../server.ts';
import { collectLogs, mcpClient, REPO, sample, tempDir } from './helpers.ts';

const COMMIT = 'testcommit';

let index: Index;
let client: Client;

beforeAll(async () => {
  index = load(REPO, COMMIT);
  const state = new KbState(REPO, collectLogs().logger);
  state.index = index;
  client = await mcpClient(state);
});
afterAll(() => client.close());

function merged() {
  return [...index.entries.values()].filter(e => e.mergedInto.length);
}

test('initialize declares resources, without subscriptions', () => {
  expect(client.getServerCapabilities()?.resources).toEqual({ listChanged: false });
});

test("resources/list: INDEX.md's Quick answers, each topic's, and each entry but the merged ones", async () => {
  const { resources } = await client.listResources();
  expect(resources).toHaveLength(1 + index.topics.size + index.entries.size - merged().length);
  expect(resources[0].uri).toBe('kb://quick-answers');
  expect(resources).toContainEqual({
    uri: 'kb://topic/mcp',
    name: 'mcp',
    title: `${index.topics.get('mcp')}: Quick answers and recommendations`,
    mimeType: 'text/markdown',
  });
  const entry = index.entries.get('MCP-017')!;
  expect(resources).toContainEqual({
    uri: 'kb://entry/MCP-017',
    name: 'MCP-017',
    title: entry.title,
    mimeType: 'text/markdown',
  });
  const uris = resources.map(r => r.uri);
  for (const e of merged()) expect(uris).not.toContain(`kb://entry/${e.id}`);
  // Claude Code requests the list on connecting
  expect(JSON.stringify(resources).length).toBeLessThan(100_000);
});

test('resources/templates/list: an entry by ID', async () => {
  const { resourceTemplates } = await client.listResourceTemplates();
  expect(resourceTemplates.map(t => t.uriTemplate)).toEqual(['kb://entry/{id}']);
});

test.each([
  ['kb://entry/MCP-017', '## [MCP-017]'],
  ['kb://entry/mcp-17', '## [MCP-017]'],
  ['kb://topic/mcp', ': Quick answers\n'],
  ['kb://quick-answers', '# Quick answers across the knowledge base'],
])('resources/read %s', async (uri, expected) => {
  const { contents } = await client.readResource({ uri });
  expect(contents).toEqual([{ uri, mimeType: 'text/markdown', text: expect.stringContaining(expected) }]);
  expect((contents[0] as { text: string }).text).toContain(`corpus: ${COMMIT}`);
});

test('a merged entry reads with the entry it points to', async () => {
  const [entry] = merged();
  const { contents } = await client.readResource({ uri: `kb://entry/${entry.id}` });
  const { text } = contents[0] as { text: string };
  expect(text).toContain(`## [${entry.id}]`);
  expect(text).toContain(`## [${entry.mergedInto[0]}]`);
});

test.each(['kb://entry/MCP-999', 'kb://topic/nope', 'kb://entry/', 'kb://other', 'https://example.com/'])(
  '%s is not found',
  async uri => {
    const before = await sample('kb_resource_reads_total', { kind: 'not_found' });
    // The server sends the 2025 revisions' -32002 (server.test.ts); the SDK's client hands it on as 2026-07-28's -32602
    await expect(client.readResource({ uri })).rejects.toMatchObject({ code: -32602, data: { uri } });
    expect(await sample('kb_resource_reads_total', { kind: 'not_found' })).toBe(before + 1);
  },
);

test('reads are counted by kind', async () => {
  const before = await sample('kb_resource_reads_total', { kind: 'entry' });
  await client.readResource({ uri: 'kb://entry/TOK-005' });
  expect(await sample('kb_resource_reads_total', { kind: 'entry' })).toBe(before + 1);
});

test('before the first index: no resources, and a read says why', async () => {
  const empty = await mcpClient(new KbState(join(tempDir(), 'kb'), collectLogs().logger));
  expect((await empty.listResources()).resources).toEqual([]);
  await expect(empty.readResource({ uri: 'kb://quick-answers' })).rejects.toMatchObject({
    code: -32603,
    message: expect.stringContaining("hasn't loaded yet"),
  });
  await empty.close();
});
