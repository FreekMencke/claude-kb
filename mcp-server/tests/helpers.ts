/** Shared test setup: a fake git-sync checkout, the app on a free port, an in-process MCP client, collected log lines. */
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import type { Logger } from '@osrs-tracker/logger';
import { register } from '@osrs-tracker/express-metrics';
import { type Index, load } from '../kb-index.ts';
import { createServerLogger } from '../log.ts';
import { createApp, KbState } from '../server.ts';

export const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const MCP_HEADERS = { 'Accept': 'application/json, text/event-stream', 'Content-Type': 'application/json' };
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
  if (content.length !== 1 || content[0].type !== 'text') {
    throw new Error(`Not one text block: ${JSON.stringify(result)}`);
  }
  return { text: content[0].text, isError: result.isError === true };
}

/** A sample's value in the default registry, 0 when it has none yet. */
export async function sample(name: string, labels: Record<string, string> = {}): Promise<number> {
  for (const metric of await register.getMetricsAsJSON()) {
    for (const value of metric.values as {
      metricName?: string;
      labels?: Record<string, string | number>;
      value: number;
    }[]) {
      const sameLabels = Object.entries(labels).every(([k, v]) => String(value.labels?.[k]) === v);
      if ((value.metricName ?? metric.name) === name && sameLabels) return value.value;
    }
  }
  return 0;
}

/** Three topic files and an INDEX.md in a temporary checkout, loaded (the directory's name is the commit). */
export const ALPHA = `# Alpha things (ALP)

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

export const BETA = `# Beta (BET)

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| BET-001 | Widget storage | fact | widgets |

## [BET-001] Widget storage
- Type: fact
- Applies to: Claude API, claude.ai
- Confidence: unverified
- Last verified: 2026-10-15
- Sources: [Storage](https://example.com/storage)
- Related: ALP-001

Store widgets dry.
`;

export const EMPTY = `# Empty (EMP)

## Quick answers

Nothing yet.
`;

export const INDEX = `# Index

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Where do widgets go? | Somewhere dry. | BET-001 |

### The stack Claude works on

One row per stack topic.

| Question | Answer | Entries |
|---|---|---|
| Which way does a gadget turn? | Counter-clockwise. | ALP-002 |

## Conflicts

Open rows only. A row naming ALP-003 here, outside the table, is not one.

| Topic (entries) | Claims | Which the sources support |
|---|---|---|
| Widget spin (ALP-001, BET-001) | ALP-001: clockwise. BET-001: "dry \\| flat". | ALP-001, as e.g. the spindle shows. Settled in the v2.1 docs. |
| Gadget price (ALP-002) | ALP-002: dear in winter. | Unresolved; one source. Wait for more. |
| Widget spin, again (ALP-001) | ALP-001: anticlockwise on the moon. | ALP-001. The newest page wins here. |
| Prose only (none) | Names no entry in its first two columns. | BET-001 is right. |
`;

export function fixtureIndex(indexMd = INDEX): Index {
  const root = join(tempDir(), '0123abc');
  mkdirSync(join(root, 'topics'), { recursive: true });
  for (const [name, text] of Object.entries({ 'kb-alpha.md': ALPHA, 'kb-beta.md': BETA, 'kb-empty.md': EMPTY })) {
    writeFileSync(join(root, 'topics', name), text, 'utf8');
  }
  writeFileSync(join(root, 'INDEX.md'), indexMd, 'utf8');
  return load(root);
}
