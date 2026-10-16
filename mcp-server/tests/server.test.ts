/** The HTTP contract (no sign-in, tools, icons) and the background index of the git-sync checkout. */
import { renameSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { PUBLIC_URL } from '../mcp.ts';
import { KbState } from '../server.ts';
import {
  addCommit,
  collectLogs,
  COMMIT,
  kbState,
  MCP_HEADERS,
  mcpClient,
  rpc,
  rpcMessage,
  serve,
  tempDir,
  TOPIC,
} from './helpers.ts';

describe('the index of the git-sync checkout', () => {
  test('counts entries in the linked commit', () => {
    const { state, lines } = kbState();
    expect(state.commit).toBe(COMMIT);
    expect(state.entries).toBe(2);
    expect(state.statusText()).toMatch(new RegExp(`^Commit: ${COMMIT}\nEntries: 2\nIndex built: \\S+Z in `));
    // ci-image-test.sh greps for this line
    expect(lines).toContainEqual(
      expect.objectContaining({
        level: 'info',
        type: 'index',
        message: expect.stringMatching(`^Indexed commit ${COMMIT}: 2 entries in `),
      }),
    );
  });

  test('follows the link to a new commit', () => {
    const { state, root } = kbState();
    const commit = 'fedcba9876543210fedcba9876543210fedcba98';
    addCommit(root, commit, `${TOPIC}\n## [TST-003] Third\n- Type: fact\n`);
    // git-sync swaps the link atomically: a new link renamed over the old one
    symlinkSync(join('.worktrees', commit), join(root, 'kb.new'));
    renameSync(join(root, 'kb.new'), join(root, 'kb'));
    state.refresh();
    expect([state.commit, state.entries]).toEqual([commit, 3]);
  });

  test("doesn't re-index an unchanged commit", () => {
    const { state } = kbState();
    const index = state.index;
    state.refresh();
    expect(state.index).toBe(index);
  });

  test('before the first sync', () => {
    const state = new KbState(join(tempDir(), 'git', 'kb'), collectLogs().logger);
    state.refresh();
    expect(state.commit).toBeUndefined();
    expect(state.statusText()).toContain('git-sync');
  });

  test('a failed refresh is logged and keeps the old index', () => {
    const { logger, lines } = collectLogs();
    // A link to a checkout without topics/
    const root = tempDir();
    symlinkSync(root, join(root, 'kb'));
    const stop = new KbState(join(root, 'kb'), logger).keepRefreshed();
    stop();
    expect(lines).toContainEqual(
      expect.objectContaining({
        level: 'error',
        type: 'index',
        message: 'Refreshing the index failed; keeping commit none',
      }),
    );
    expect(lines[0].error).toContain('ENOENT');
  });
});

describe('over HTTP', () => {
  let base: string;
  let close: () => Promise<void>;

  beforeEach(async () => {
    ({ base, close } = await serve(kbState().state));
  });
  afterEach(() => close());

  test('/mcp needs no token', async () => {
    const response = await rpc(base, 'tools/call', { name: 'kb_status', arguments: {} });
    expect(response.status).toBe(200);
    const { result } = await rpcMessage(response);
    expect(result.isError).not.toBe(true);
    expect(result).not.toHaveProperty('structuredContent');
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain(`Commit: ${COMMIT}`);
  });

  test.each([
    '/.well-known/oauth-protected-resource/mcp',
    '/.well-known/oauth-protected-resource',
    '/.well-known/oauth-authorization-server',
  ])('no OAuth discovery at %s', async path => {
    // Claude signs in only when the server points it at OAuth metadata; without any, it connects directly
    expect((await fetch(base + path)).status).toBe(404);
  });

  test('/healthz needs no token', async () => {
    const response = await fetch(`${base}/healthz`);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('ok');
  });

  test('the tools contract', async () => {
    const { tools } = (await rpcMessage(await rpc(base, 'tools/list'))).result;
    expect(tools.map((t: { name: string }) => t.name)).toEqual([
      'kb_search',
      'kb_get',
      'kb_quick_answers',
      'kb_status',
    ]);
    for (const tool of tools) {
      expect(tool.title).toBeTruthy();
      expect(tool.annotations.readOnlyHint).toBe(true);
      expect(tool.annotations.destructiveHint).toBe(false);
      // Text content only: no outputSchema, and no root-level anyOf/oneOf/allOf in the input schema
      expect(tool).not.toHaveProperty('outputSchema');
      for (const key of ['anyOf', 'oneOf', 'allOf']) expect(tool.inputSchema).not.toHaveProperty(key);
      // Claude Code drops a tool whose mcp__<server>__<tool> name is over 128 characters; claude.ai allows 64
      expect(tool.name.length).toBeLessThanOrEqual(64);
    }
  });

  test('initialize carries the usage rules', async () => {
    const params = { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'test', version: '0' } };
    const { instructions } = (await rpcMessage(await rpc(base, 'initialize', params))).result;
    // The same rules as kb_search's description, for Claude Code; claude.ai web and desktop drop instructions
    for (const rule of ['kb_get the 1 to 4 best IDs', 'Cite entry IDs', '60 days']) {
      expect(instructions).toContain(rule);
    }
    expect(instructions.length).toBeLessThan(4096); // Claude Code cuts them there
  });

  test('serverInfo lists same-origin icons', async () => {
    const params = { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'test', version: '0' } };
    const { icons } = (await rpcMessage(await rpc(base, 'initialize', params))).result.serverInfo;
    expect(icons.map((icon: { mimeType: string }) => icon.mimeType)).toEqual(['image/png', 'image/svg+xml']);
    for (const icon of icons) {
      // The spec asks clients to fetch icons only over HTTPS from the server's own origin
      expect(icon.src.startsWith(`${PUBLIC_URL}/`)).toBe(true);
      const served = await fetch(icon.src.replace(PUBLIC_URL, base));
      expect(served.status).toBe(200);
      expect(served.headers.get('content-type')).toMatch(new RegExp(`^${icon.mimeType.replace('+', '\\+')}`));
    }
  });

  test.each(['/icon.png', '/icon.svg', '/favicon.ico'])('%s needs no token', async path => {
    const response = await fetch(base + path);
    expect(response.status).toBe(200);
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('cache-control')).toBe('public, max-age=86400');
    if (path !== '/icon.svg') {
      expect(Buffer.from(await response.arrayBuffer()).subarray(0, 8)).toEqual(
        Buffer.from('\x89PNG\r\n\x1a\n', 'latin1'),
      );
    }
  });

  test('a 2025-era GET or DELETE on /mcp has no session to open or end', async () => {
    for (const response of [
      await fetch(`${base}/mcp`, { headers: { Accept: 'text/event-stream' } }),
      await fetch(`${base}/mcp`, { method: 'DELETE' }),
    ]) {
      expect(response.status).toBe(405);
      expect(response.headers.get('allow')).toBe('POST');
      expect((await response.json()).error.code).toBe(-32600);
    }
  });
});

describe('the protocol', () => {
  let base: string;
  let close: () => Promise<void>;

  beforeEach(async () => {
    ({ base, close } = await serve(kbState().state));
  });
  afterEach(() => close());

  function post(body: string, headers: Record<string, string> = {}): Promise<Response> {
    return fetch(`${base}/mcp`, { method: 'POST', headers: { ...MCP_HEADERS, ...headers }, body });
  }

  const PING = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' });

  test.each([
    ['2025-03-26', '2025-03-26'],
    ['2025-11-25', '2025-11-25'],
    ['2099-01-01', '2025-11-25'],
  ])('initialize asking for %s gets %s', async (asked, version) => {
    const params = { protocolVersion: asked, capabilities: {}, clientInfo: { name: 'test', version: '0' } };
    const { result } = await rpcMessage(await rpc(base, 'initialize', params));
    expect(result.protocolVersion).toBe(version);
    expect(result.capabilities).toEqual({ tools: { listChanged: false }, resources: { listChanged: false } });
  });

  test("a 2026-07-28 client's probe gets a 400, its cue to fall back", async () => {
    const probe = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'server/discover' });
    const response = await post(probe, { 'MCP-Protocol-Version': '2026-07-28' });
    expect(response.status).toBe(400);
    expect((await response.json()).error.message).toContain('Unsupported MCP-Protocol-Version 2026-07-28');
  });

  test('the SDK client falls back from the probe to initialize', async () => {
    const client = await mcpClient(kbState().state);
    expect((await client.listTools()).tools).toHaveLength(4);
    await client.close();
  });

  test.each(['2025-11-25', '2025-03-26'])('MCP-Protocol-Version %s is served', async version => {
    expect((await post(PING, { 'MCP-Protocol-Version': version })).status).toBe(200);
  });

  test('a notification gets 202 and no body', async () => {
    const response = await post(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }));
    expect(response.status).toBe(202);
    expect(await response.text()).toBe('');
  });

  test('a batch gets one reply per request', async () => {
    const response = await post(
      JSON.stringify([
        { jsonrpc: '2.0', id: 1, method: 'ping' },
        { jsonrpc: '2.0', method: 'notifications/initialized' },
        { jsonrpc: '2.0', id: 'b', method: 'tools/list' },
      ]),
    );
    const replies = await response.json();
    expect(replies.map((r: { id: unknown }) => r.id)).toEqual([1, 'b']);
    expect(replies[0].result).toEqual({});
  });

  test.each([
    ['not json', 400, -32700],
    ['{"jsonrpc":"1.0","id":1,"method":"ping"}', 400, -32600],
    ['{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"kb_nope"}}', 200, -32602],
    // Resource not found, in the 2025 revisions; 2026-07-28 moved it to -32602 and asks clients to accept both
    ['{"jsonrpc":"2.0","id":1,"method":"resources/read","params":{"uri":"kb://entry/TST-999"}}', 200, -32002],
  ])('%s: HTTP %i, JSON-RPC %i', async (body, status, code) => {
    const response = await post(body);
    expect(response.status).toBe(status);
    expect((await response.json()).error.code).toBe(code);
  });

  test.each([PUBLIC_URL, 'http://localhost:6274', 'http://127.0.0.1:8765', 'http://[::1]:8765'])(
    'Origin %s is served',
    async origin => {
      expect((await post(PING, { Origin: origin })).status).toBe(200);
    },
  );

  test.each(['https://evil.example', 'null', 'http://localhost.evil.example'])('Origin %s gets 403', async origin => {
    const response = await post(PING, { Origin: origin });
    expect(response.status).toBe(403);
    expect((await response.json()).error.code).toBe(-32600);
    // On every method, so a GET gets 403 rather than 405
    expect((await fetch(`${base}/mcp`, { headers: { Origin: origin } })).status).toBe(403);
  });

  test('a body that says it isn’t JSON gets 415', async () => {
    const response = await post(PING, { 'Content-Type': 'text/plain' });
    expect(response.status).toBe(415);
    expect((await response.json()).error.code).toBe(-32600);
  });
});
