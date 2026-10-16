/**
 * claude-kb's remote MCP server: the knowledge base as tools, for claude.ai and Claude Code.
 *
 * Tools (FreekMencke/claude-kb#112, text built in kb-tools.ts): `kb_search`, `kb_get`, `kb_quick_answers` and
 * `kb_status`, all read-only, and open to anyone without a sign-in: the knowledge base is a public repo
 * (FreekMencke/claude-kb#142). Traefik rate-limits each client IP (claude-kb-mcp.yaml). The MCP protocol is in mcp.ts;
 * Express, logs and metrics are set up as in the Node apps (osrs-tracker-api and osrs-tracker-web).
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
import { type Logger, requestLogger } from '@osrs-tracker/logger';
import express, { type NextFunction, type Request, type Response } from 'express';
import { type Index, load } from './kb-index.ts';
import { type KbLogType, logger as serverLogger } from './log.ts';
import { handle, type Icon } from './mcp.ts';
import { httpMetrics, indexLoaded, routeLabel } from './metrics.ts';
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
// A tool call is a few hundred bytes
const MAX_BODY = '64kb';

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
    return (
      `Commit: ${this.commit}\n` +
      `Entries: ${this.entries}\n` +
      `Index built: ${this.index.builtAt.toISOString().slice(0, 19)}Z in ${this.index.buildSeconds.toFixed(2)} s`
    );
  }
}

/** The app on port 8000 and the metrics app (`GET /metrics`, port 9090), as the Node apps set them up. */
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

  const uncaughtLog = logger.child({ type: 'uncaught' satisfies KbLogType });
  const info = { icons: ICONS };
  // Stateless and JSON only: no session, no stream, so GET (a server-to-client stream) and DELETE (ending a session)
  // have nothing to do
  app.post(MCP_PATH, (req, res, next) => {
    if (!req.is('application/json')) return void res.status(415).send('Send Content-Type: application/json');
    express.json({ limit: MAX_BODY, strict: false })(req, res, error => {
      // A body that isn't JSON is JSON-RPC's parse error, not Express's HTML 400
      if (error && error.type !== 'entity.parse.failed') return next(error);
      const reply = handle(error ? undefined : req.body, state, info, e => {
        uncaughtLog.error({ error: e }, `${req.method} ${req.originalUrl} failed`);
      });
      if (reply.body === undefined) res.status(reply.status).end();
      else res.status(reply.status).json(reply.body);
    });
  });
  app.all(MCP_PATH, (_req, res) => void res.status(405).set('Allow', 'POST').end());

  // Log errors and answer a generic 500: Express's default handler sends the stack unless NODE_ENV=production
  app.use((error: { status?: number }, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(error);
    // body-parser's own: 413 for a body over MAX_BODY, 400 for a bad encoding
    if (error.status && error.status < 500) return void res.status(error.status).end();
    uncaughtLog.error({ error }, `${req.method} ${req.originalUrl} failed`);
    res.status(500).send('Internal Server Error');
  });

  return { app, metricsApp };
}

function main(args: string[]): void {
  const { values } = parseArgs({
    args,
    options: { local: { type: 'boolean', default: false }, port: { type: 'string' } },
  });
  const port = Number(values.port ?? process.env.PORT ?? 8000);
  const lifecycleLog = serverLogger.child({ type: 'lifecycle' satisfies KbLogType });
  const state = new KbState(process.env.KB_LINK ?? (values.local ? join(HERE, '..') : '/git/kb'));
  const { app, metricsApp } = createApp(state);

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
  configureGracefulShutdown(serverLogger, server, metricsServer, async () => stopRefreshing());
}

if (import.meta.main) main(process.argv.slice(2));
