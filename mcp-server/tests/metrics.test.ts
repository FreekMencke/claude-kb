/**
 * The Prometheus metrics (FreekMencke/claude-kb#136): HTTP requests by route, tool calls, empty searches, the index
 * gauges, and the /metrics endpoint on its own port.
 */
import type { AddressInfo } from 'node:net';
import { expect, test } from 'vitest';
import { register } from '@osrs-tracker/express-metrics';
import { TOOLS } from '../metrics.ts';
import { createApp, type KbState } from '../server.ts';
import { callTool, collectLogs, kbState, mcpClient, sample, serve } from './helpers.ts';

/** The app, not listening: creating it registers the metrics. */
function registerMetrics(state: KbState): void {
  createApp(state, { logger: collectLogs().logger });
}

test('requests are counted by route template, the probes not at all', async () => {
  const { base, close } = await serve(kbState().state);
  const count = 'http_request_duration_seconds_count';
  try {
    expect((await fetch(`${base}/healthz`)).status).toBe(200);
    expect((await fetch(`${base}/mcp`, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } })).status).toBe(400);
    expect((await fetch(`${base}/wp-login.php`)).status).toBe(404);
    expect((await fetch(`${base}/.env`)).status).toBe(404);
  } finally {
    await close();
  }
  // Before the metrics middleware, as in the Node apps: the dashboards leave /healthz out anyway
  expect(await sample(count, { path: '/healthz' })).toBe(0);
  expect(await sample(count, { method: 'POST', path: '/mcp', status_code: '400' })).toBe(1);
  // Unknown paths share one series, so scanners can't add one per path
  expect(await sample(count, { method: 'GET', path: 'other', status_code: '404' })).toBe(2);
});

test('tool calls, their outcomes and empty searches', async () => {
  const { state } = kbState();
  registerMetrics(state);
  const calls = 'kb_tool_calls_total';
  const before = await Promise.all([
    sample(calls, { tool: 'kb_search', outcome: 'ok' }),
    sample(calls, { tool: 'kb_get', outcome: 'error' }),
    sample('kb_search_empty_total'),
    sample('kb_tool_duration_seconds_count', { tool: 'kb_search' }),
  ]);
  const client = await mcpClient(state);
  await callTool(client, 'kb_search', { query: 'zzqqxx' });
  expect((await callTool(client, 'kb_get', { ids: ['NOPE-999'] })).isError).toBe(true);
  await client.close();

  expect(await sample(calls, { tool: 'kb_search', outcome: 'ok' })).toBe(before[0] + 1);
  expect(await sample(calls, { tool: 'kb_get', outcome: 'error' })).toBe(before[1] + 1);
  expect(await sample('kb_search_empty_total')).toBe(before[2] + 1);
  expect(await sample('kb_tool_duration_seconds_count', { tool: 'kb_search' })).toBe(before[3] + 1);
});

test('every tool and outcome starts at zero', async () => {
  registerMetrics(kbState().state);
  const text = await register.getSingleMetricAsString('kb_tool_calls_total');
  for (const tool of TOOLS) {
    for (const outcome of ['ok', 'error']) expect(text).toMatch(`kb_tool_calls_total{tool="${tool}",outcome="${outcome}"} `);
  }
});

test('the index gauges follow a refresh', async () => {
  const { state } = kbState();
  registerMetrics(state);
  expect(await sample('kb_index_entries')).toBe(state.entries);
  expect(await sample('kb_index_build_seconds')).toBe(state.index!.buildSeconds);
  expect(await sample('kb_index_built_timestamp_seconds')).toBe(state.index!.builtAt.getTime() / 1000);
});

test('/metrics on its own port, as Alloy scrapes it', async () => {
  const { state } = kbState();
  const { base, metricsApp, close } = await serve(state);
  await fetch(`${base}/mcp`, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } });
  const metricsServer = metricsApp.listen(0, '127.0.0.1');
  await new Promise(resolve => metricsServer.once('listening', resolve));
  try {
    const port = (metricsServer.address() as AddressInfo).port;
    const body = await (await fetch(`http://127.0.0.1:${port}/metrics`)).text();
    for (const name of [
      'http_request_duration_seconds_count',
      'kb_tool_calls_total',
      'kb_index_entries',
      'up',
      'process_resident_memory_bytes',
      'nodejs_heap_size_used_bytes',
    ]) {
      expect(body).toMatch(new RegExp(`^${name}[{ ]`, 'm'));
    }
    // Whole numbers without a .0 (ci-image-test.sh matches this line)
    expect(body).toMatch(new RegExp(`^kb_index_entries ${state.entries}$`, 'm'));
  } finally {
    await new Promise(resolve => metricsServer.close(resolve));
    await close();
  }
});
