/** The JSON log lines: the Node apps' shape (`@osrs-tracker/logger`), and one request line per request except the probes. */
import { expect, test } from 'vitest';
import { collectLogs, kbState, MCP_HEADERS, serve } from './helpers.ts';

test("lines are JSON with pino's level names, a type and a message", () => {
  const { logger, lines } = collectLogs();
  logger.child({ type: 'index' }).warn('Refreshing failed: x');
  expect(lines).toEqual([
    { level: 'warn', time: expect.stringMatching(/Z$/), type: 'index', message: 'Refreshing failed: x' },
  ]);
});

test('an error becomes the error field, with its stack', () => {
  const { logger, lines } = collectLogs();
  logger.child({ type: 'index' }).error({ error: new Error('bad index') }, 'Refreshing failed');
  expect(lines[0].error).toMatch(/^Error: bad index\n    at /);
});

test('requests are logged by route, except the probes', async () => {
  const { logger, lines } = collectLogs();
  const { base, close } = await serve(kbState().state, logger);
  try {
    await fetch(`${base}/healthz`);
    await fetch(`${base}/mcp`, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } });
    await fetch(`${base}/icon.svg?v=1`);
    await fetch(`${base}/wp-login.php`);
  } finally {
    await close();
  }
  const requests = lines.filter(line => line.type === 'incoming');
  expect(requests.map(({ method, route, url, status }) => [method, route, url, status])).toEqual([
    ['POST', '/mcp', '/mcp', '400'],
    ['GET', '/icon.svg', '/icon.svg?v=1', '200'],
    ['GET', 'other', '/wp-login.php', '404'],
  ]);
  expect(requests[0].level).toBe('warn');
  expect(requests[0].responseTime).toMatch(/^\d+ms$/);
  // No client IP: README, "Logs"
  expect(requests.every(line => !('clientIp' in line))).toBe(true);
});

test('a tool call logs the entry IDs it returned, never its arguments', async () => {
  const { logger, lines } = collectLogs();
  const { base, close } = await serve(kbState().state, logger);
  const call = (id: number, name: string, args: object) =>
    fetch(`${base}/mcp`, {
      method: 'POST',
      headers: MCP_HEADERS,
      body: JSON.stringify({ jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args } }),
    });
  try {
    await call(1, 'kb_search', { query: 'secret-word Second' });
    await call(2, 'kb_get', { ids: ['tst-2', 'TST-404'] });
    await call(3, 'kb_status', {});
    await call(4, 'kb_search', { query: 'Second', confidence: 'single-source', applies_to: 'Claude API' });
  } finally {
    await close();
  }
  const requests = lines.filter(line => line.type === 'incoming');
  expect(requests.map(line => line.tools)).toEqual([
    [{ tool: 'kb_search', ids: ['TST-002'] }],
    [{ tool: 'kb_get', ids: ['TST-002'], unknown: 1 }],
    [{ tool: 'kb_status' }],
    [{ tool: 'kb_search', ids: [] }],
  ]);
  expect(JSON.stringify(lines)).not.toMatch(/secret-word|TST-404|single-source|Claude API/);
});
