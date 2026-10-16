/**
 * claude-kb's remote MCP server: the knowledge base as tools, for claude.ai and Claude Code.
 *
 * Tools (FreekMencke/claude-kb#112, text built in kb-tools.ts): `kb_search`, `kb_get`, `kb_quick_answers` and
 * `kb_status`, all read-only, and open to anyone without a sign-in: the knowledge base is a public repo
 * (FreekMencke/claude-kb#142). Traefik rate-limits each client IP (claude-kb-mcp.yaml). Express, logs and metrics are
 * set up as in the Node apps (osrs-tracker-api and osrs-tracker-web).
 *
 * The KB itself is a git-sync checkout of main on a shared volume (KB_LINK), never part of the image. A timer re-reads
 * it when the link's target, the synced commit, changes, so no request waits on it.
 *
 * Run: `node server.ts` (production, reading KB_LINK) or `node server.ts --local` (127.0.0.1 only, reading the
 * checkout it runs from, no metrics port, for the MCP Inspector).
 */
import { realpathSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { type CallToolResult, createMcpHandler, type Icon, McpServer } from '@modelcontextprotocol/server';
import { type Logger, requestLogger } from '@osrs-tracker/logger';
import express, { type NextFunction, type Request, type Response } from 'express';
import * as z from 'zod';
import { type Index, load } from './kb-index.ts';
import * as tools from './kb-tools.ts';
import { type KbLogType, logger as serverLogger } from './log.ts';
import { httpMetrics, indexLoaded, routeLabel, timedTool } from './metrics.ts';
import packageJson from './package.json' with { type: 'json' };
import { configureGracefulShutdown } from './shutdown.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
// ../assets, in the repo and in the image alike
const ASSETS = join(HERE, '..', 'assets');

export const PUBLIC_URL = 'https://claude-kb.freekmencke.com';
const MCP_PATH = '/mcp';
const METRICS_PORT = 9090;
// The logo, served by this server: the MCP spec asks clients to fetch icons only from the server's own origin, over
// HTTPS and without credentials. Its rounded green background suits light and dark themes alike. The PNG is also
// /favicon.ico: how claude.ai picks a custom connector's icon isn't documented.
const ICON_FILES: Record<string, string> = {
  '/icon.png': 'logo.png',
  '/icon.svg': 'logo.svg',
  '/favicon.ico': 'logo.png',
};
const ICONS: Icon[] = [
  { src: `${PUBLIC_URL}/icon.png`, mimeType: 'image/png', sizes: ['512x512'] },
  { src: `${PUBLIC_URL}/icon.svg`, mimeType: 'image/svg+xml', sizes: ['any'] },
];
// How often to check whether git-sync (every 60 s) has moved the link to a new commit: a realpath, so cheap
const REFRESH_SECONDS = 10;
// Read-only tools can run without a per-call prompt
const READ_ONLY = { readOnlyHint: true, destructiveHint: false, openWorldHint: false };

/**
 * The index of the synced checkout. `refresh` runs on a timer, never in a request: it builds a new Index and swaps it
 * in with one assignment, so a request reads either the old index or the new one, whole.
 */
export class KbState {
  readonly link: string;
  index: Index | undefined;
  readonly #log: Logger;

  constructor(link: string, logger: Logger = serverLogger) {
    this.link = link;
    this.#log = logger.child({ type: 'index' satisfies KbLogType });
  }

  get commit(): string | undefined {
    return this.index?.commit;
  }

  get entries(): number | undefined {
    return this.index?.entries.size;
  }

  refresh(): void {
    // git-sync flips the link atomically; "the basename of the target of the link is the current hash"
    let target: string;
    try {
      target = realpathSync(this.link);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
      throw error;
    }
    if (basename(target) === this.commit) return;
    this.index = load(target);
    indexLoaded(this.index);
    this.#log.info(
      `Indexed commit ${this.commit}: ${this.entries} entries in ${this.index.buildSeconds.toFixed(2)} s`,
    );
  }

  /**
   * Refreshes now and then every REFRESH_SECONDS, logging a failure and keeping the old index. A build blocks the
   * event loop while it runs (a fraction of a second, once per KB push). Returns a function that stops it.
   */
  keepRefreshed(): () => void {
    const refresh = () => {
      try {
        this.refresh();
      } catch (error) {
        this.#log.error({ error }, `Refreshing the index failed; keeping commit ${this.commit ?? 'none'}`);
      }
    };
    refresh();
    const timer = setInterval(refresh, REFRESH_SECONDS * 1000);
    return () => clearInterval(timer);
  }

  statusText(): string {
    if (this.index === undefined) return `No checkout yet: git-sync hasn't created ${this.link}.`;
    // Python's isoformat(timespec='seconds') for a UTC time
    const builtAt = `${this.index.builtAt.toISOString().slice(0, 19)}+00:00`;
    return (
      `Commit: ${this.commit}\n` +
      `Entries: ${this.entries}\n` +
      `Index built: ${builtAt} in ${this.index.buildSeconds.toFixed(2)} s`
    );
  }
}

function text(result: string): CallToolResult {
  return { content: [{ type: 'text', text: result }] };
}

/**
 * The server with its tools, built for each request (createMcpHandler). Descriptions carry the usage rules too:
 * claude.ai web and desktop drop `instructions` (anthropics/claude-ai-mcp#93); Claude Code keeps them. Keep names,
 * titles and descriptions as they are, line breaks included (the Python server's docstrings): claude.ai's "Always
 * allow" is reported to be keyed on their hash (anthropics/claude-ai-mcp#1087). Bounds are checked in kb-tools.ts,
 * not the schemas, so a bad value gets its own message. Text content only: with an output schema, Claude Code hands
 * Claude the structured JSON instead.
 */
export function createMcpServer(state: KbState): McpServer {
  const server = new McpServer(
    { name: 'claude-kb', version: packageJson.version, icons: ICONS },
    { instructions: tools.INSTRUCTIONS },
  );

  server.registerTool(
    'kb_search',
    {
      title: 'Search the knowledge base',
      description: [
        'Search claude-kb, a knowledge base on using Claude and Claude Code efficiently: models and effort,',
        'subagents, skills, hooks, prompting, CLAUDE.md and memory, MCP servers and connectors, sessions, workflows,',
        'tokens and caching, docs, SEO. Returns entry IDs with title, type, confidence, last-verified date and a',
        'summary. Search first, then kb_get the 1 to 4 best IDs. Cite entry IDs. Check an entry last verified more',
        'than 60 days ago against its sources.',
      ].join('\n'),
      inputSchema: z.object({
        query: z.string().describe('Words, a phrase, or entry IDs such as MCP-017'),
        topic: z.string().nullish().describe('Only this topic: a name such as mcp or a prefix such as MCP'),
        type: z
          .string()
          .nullish()
          .describe('Only this entry type: fact, pattern, recommendation, anti-pattern, tool or comparison'),
        limit: z.int().default(8).describe('How many entries, 1 to 20'),
      }),
      annotations: READ_ONLY,
    },
    timedTool('kb_search', ({ query, topic, type, limit }) =>
      text(tools.search(state.index, query, topic, type, limit)),
    ),
  );

  server.registerTool(
    'kb_get',
    {
      title: 'Read entries',
      description: [
        'The full Markdown of claude-kb entries by ID, with their sources, confidence, last-verified date and',
        'related IDs. A merged entry comes with the entry it points to.',
      ].join('\n'),
      inputSchema: z.object({
        ids: z.array(z.string()).describe('1 to 10 entry IDs, such as ["MCP-017", "TOK-005"]'),
      }),
      annotations: READ_ONLY,
    },
    timedTool('kb_get', ({ ids }) => text(tools.get(state.index, ids))),
  );

  server.registerTool(
    'kb_quick_answers',
    {
      title: 'Quick answers',
      description: [
        "claude-kb's most-asked questions, each with a one-line answer and its entry IDs: across the knowledge base,",
        "or for one topic together with that topic's recommendations for our setup.",
      ].join('\n'),
      inputSchema: z.object({
        topic: z.string().nullish().describe('A topic name such as mcp or a prefix such as MCP; leave out for all'),
      }),
      annotations: READ_ONLY,
    },
    timedTool('kb_quick_answers', ({ topic }) => text(tools.quickAnswers(state.index, topic))),
  );

  server.registerTool(
    'kb_status',
    {
      title: 'Knowledge base status',
      description: 'The claude-kb commit this server has loaded, its number of entries, and when it last indexed them.',
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    timedTool('kb_status', () => text(state.statusText())),
  );
  return server;
}

/**
 * The app on port 8000 and the metrics app (`GET /metrics`, port 9090), as the Node apps set them up. `mcp` is the MCP
 * handler, closed on shutdown.
 */
export function createApp(state: KbState, { logger = serverLogger }: { logger?: Logger } = {}) {
  const app = express();
  // Only Traefik reaches the pod, and it adds the client's address to X-Forwarded-For, so req.ip is the client
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  const metricsApp = express();
  metricsApp.disable('x-powered-by');

  // The kubelet's probes, one every few seconds: before the metrics and the request log, so they show up in neither
  app.get('/healthz', (_req, res) => void res.type('text/plain').send('ok'));
  app.use(httpMetrics(metricsApp), requestLogger({ logger, route: req => routeLabel(req) }));

  for (const [path, file] of Object.entries(ICON_FILES)) {
    // `root`, so only the file name is checked for dotfiles (a checkout under .claude/worktrees would 404)
    app.get(path, (_req, res) =>
      res.sendFile(file, { root: ASSETS, maxAge: '1d', headers: { 'X-Content-Type-Options': 'nosniff' } }),
    );
  }

  // Stateless: a fresh server for each request and no session ID, for 2025-era clients too (the SDK's default)
  const mcp = createMcpHandler(() => createMcpServer(state));
  const handleMcp = toNodeHandler(mcp);
  app.all(MCP_PATH, (req, res) => handleMcp(req, res));

  // Log errors and answer a generic 500: Express's default handler sends the stack unless NODE_ENV=production
  const uncaughtLog = logger.child({ type: 'uncaught' satisfies KbLogType });
  app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
    uncaughtLog.error({ error }, `${req.method} ${req.originalUrl} failed`);
    if (res.headersSent) return next(error);
    res.status(500).send('Internal Server Error');
  });

  return { app, metricsApp, mcp };
}

function main(args: string[]): void {
  const { values } = parseArgs({
    args,
    options: { local: { type: 'boolean', default: false }, port: { type: 'string' } },
  });
  const port = Number(values.port ?? process.env.PORT ?? 8000);
  const lifecycleLog = serverLogger.child({ type: 'lifecycle' satisfies KbLogType });
  const state = new KbState(process.env.KB_LINK ?? (values.local ? join(HERE, '..') : '/git/kb'));
  const { app, metricsApp, mcp } = createApp(state);

  const host = values.local ? '127.0.0.1' : '0.0.0.0';
  const server = app.listen(port, host, () => {
    lifecycleLog.info(`MCP server listening on http://${host}:${port}${MCP_PATH}`);
  });
  // Traefik reuses idle backend connections for up to 90 s; with Node's 5 s default it could send a request on a
  // connection Node is just closing, a 502
  server.keepAliveTimeout = 95_000;
  const metricsServer = values.local
    ? undefined
    : metricsApp.listen(METRICS_PORT, () => {
        lifecycleLog.info(`Metrics server listening on http://0.0.0.0:${METRICS_PORT}/metrics`);
      });

  const stopRefreshing = state.keepRefreshed();
  // Closing the MCP handler ends its open streams, which would otherwise keep the server from closing
  configureGracefulShutdown(serverLogger, server, metricsServer, async () => {
    stopRefreshing();
    await mcp.close();
  });
}

if (import.meta.main) main(process.argv.slice(2));
