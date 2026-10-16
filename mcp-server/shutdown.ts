import type { Server } from 'node:http';
import type { Logger } from '@osrs-tracker/logger';
import type { KbLogType } from './log.ts';

/**
 * Shut down gracefully on SIGINT/SIGTERM, as the Node apps do (osrs-tracker-web's `utils/shutdown.ts`): run the
 * cleanup, stop accepting connections, and once the server has closed, close the metrics server and exit (or exit after
 * 10 seconds). The manifest's preStop hook has already waited 5 seconds for Traefik to drop the pod.
 */
export function configureGracefulShutdown(
  logger: Logger,
  server: Server,
  metricsServer: Server | undefined,
  cleanup: () => Promise<void>,
): void {
  const lifecycleLog = logger.child({ type: 'lifecycle' satisfies KbLogType });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => {
      lifecycleLog.info(`Received ${signal}, shutting down gracefully`);
      setTimeout(() => {
        lifecycleLog.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10_000).unref();
      closeServers(server, metricsServer, cleanup)
        .then(() => {
          lifecycleLog.info('Servers closed');
          process.exit(0);
        })
        .catch((error: unknown) => {
          lifecycleLog.error({ error }, 'Shutting down failed');
          process.exit(1);
        });
    });
  }
}

/** Closes the server, runs the cleanup, then closes the metrics server, resolving once all have closed. */
export async function closeServers(
  server: Server,
  metricsServer: Server | undefined,
  cleanup: () => Promise<void>,
): Promise<void> {
  const closed = new Promise(resolve => server.close(resolve));
  // `close` only closes the connections that are idle right now: with the long keep-alive timeout, close the others as
  // they become idle
  const closeIdle = setInterval(() => server.closeIdleConnections(), 100);
  await cleanup();
  await closed;
  clearInterval(closeIdle);
  if (metricsServer) await new Promise(resolve => metricsServer.close(resolve));
}
