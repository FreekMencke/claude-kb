/** Shared test setup: a fake git-sync checkout, the app on a free port, an in-process MCP client, collected log lines. */
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import type { Logger } from '@osrs-tracker/logger';
import { register } from '@osrs-tracker/express-metrics';
import { createServerLogger } from '../log.ts';
import { createApp, KbState } from '../server.ts';

export const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const MCP_HEADERS = { Accept: 'application/json, text/event-stream', 'Content-Type': 'application/json' };
export const COMMIT = '0123456789abcdef0123456789abcdef01234567';
export const TOPIC = `# Topic

## [TST-001] First
- Type: fact

Body.

## [TST-002] Second
- Type: fact

Body.

## Recommendations for our setup
`;

/** A logger that keeps its lines, parsed, instead of writing them to stdout (osrs-tracker-web's `collectLogs`). */
export function collectLogs(): { logger: Logger; lines: Record<string, unknown>[] } {
  const lines: Record<string, unknown>[] = [];
  return { logger: createServerLogger({ write: (line: string) => void lines.push(JSON.parse(line)) }), lines };
}

export function tempDir(): string {
  return mkdtempSync(join(tmpdir(), 'claude-kb-mcp-'));
}

/** git-sync's --root: the checkout in .worktrees/<hash>, and the `kb` link pointing at it. */
export function kbRoot(): string {
  const root = join(tempDir(), 'git');
  addCommit(root, COMMIT, TOPIC);
  symlinkSync(join('.worktrees', COMMIT), join(root, 'kb'));
  return root;
}

export function addCommit(root: string, commit: string, topic: string): void {
  const topics = join(root, '.worktrees', commit, 'topics');
  mkdirSync(topics, { recursive: true });
  writeFileSync(join(topics, 'kb-test.md'), topic, 'utf8');
}

/** The KB state of a fresh fake checkout, indexed, logging to a collector. */
export function kbState(): { state: KbState; root: string; lines: Record<string, unknown>[] } {
  const root = kbRoot();
  const { logger, lines } = collectLogs();
  const state = new KbState(join(root, 'kb'), logger);
  state.refresh();
  return { state, root, lines };
}

/** The app listening on a free port of 127.0.0.1; `close` stops it. */
export async function serve(state: KbState, logger?: Logger) {
  const { app, metricsApp } = createApp(state, { logger: logger ?? collectLogs().logger });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return {
    base,
    metricsApp,
    close: async () => {
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    },
  };
}

/** One JSON-RPC request to /mcp, without a token: the server has no sign-in. */
export function rpc(base: string, method: string, params: Record<string, unknown> = {}): Promise<Response> {
  return fetch(`${base}/mcp`, {
    method: 'POST',
    headers: MCP_HEADERS,
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
}

/** The JSON-RPC message in a Streamable HTTP response, sent as JSON or as one SSE event. */
export async function rpcMessage(response: Response): Promise<Record<string, any>> {
  const body = await response.text();
  if (response.headers.get('content-type')?.startsWith('application/json')) return JSON.parse(body);
  const data = body.split('\n').filter(line => line.startsWith('data: '));
  return JSON.parse(data.at(-1)!.slice('data: '.length));
}

/**
 * The SDK's client connected to the app over HTTP. It negotiates as a 2026-07-28 client would: it probes with
 * `server/discover` and falls back to initialize. Closing it stops the app too.
 */
export async function mcpClient(state: KbState): Promise<Client> {
  const app = await serve(state);
  const client = new Client({ name: 'test', version: '0' }, { versionNegotiation: { mode: 'auto' } });
  await client.connect(new StreamableHTTPClientTransport(new URL(`${app.base}/mcp`)));
  const close = client.close.bind(client);
  client.close = async () => {
    await close();
    await app.close();
  };
  return client;
}

/** A tool's text and whether it's an error. */
export async function callTool(client: Client, name: string, args: Record<string, unknown> = {}) {
  const result = await client.callTool({ name, arguments: args });
  const content = result.content as { type: string; text: string }[];
  if (content.length !== 1 || content[0].type !== 'text') throw new Error(`Not one text block: ${JSON.stringify(result)}`);
  return { text: content[0].text, isError: result.isError === true };
}

/** A sample's value in the default registry, 0 when it has none yet. */
export async function sample(name: string, labels: Record<string, string> = {}): Promise<number> {
  for (const metric of await register.getMetricsAsJSON()) {
    for (const value of metric.values as { metricName?: string; labels?: Record<string, string | number>; value: number }[]) {
      const sameLabels = Object.entries(labels).every(([k, v]) => String(value.labels?.[k]) === v);
      if ((value.metricName ?? metric.name) === name && sameLabels) return value.value;
    }
  }
  return 0;
}
