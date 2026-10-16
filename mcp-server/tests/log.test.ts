/** The JSON log lines: the Node apps' shape (`@osrs-tracker/logger`), and one request line per request except the probes. */
import { expect, test } from 'vitest';
import { collectLogs, kbState, serve } from './helpers.ts';

test("lines are JSON with pino's level names, a type and a message", () => {
  const { logger, lines } = collectLogs();
  logger.child({ type: 'index' }).warn('Refreshing failed: x');
  expect(lines).toEqual([{ level: 'warn', time: expect.stringMatching(/Z$/), type: 'index', message: 'Refreshing failed: x' }]);
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
  expect(requests[0].clientIp).toBe('127.0.0.1');
});
