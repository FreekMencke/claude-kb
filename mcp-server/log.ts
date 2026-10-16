import { createLogger, type CreateLoggerOptions, type Logger, type LogType } from '@osrs-tracker/logger';

/**
 * What a log line is about (`| json | type="index"` in Grafana): the package's `incoming` (`requestLogger`, one line
 * per request), `lifecycle` (startup and shutdown) and `uncaught`, plus `index` for building the index of a new
 * git-sync commit (`server.ts`, `KbState`). The MCP Server Dashboard shows them as one readable line each.
 */
export type KbLogType = LogType<'index'>;

/** The server's logger, the Node apps' format (`@osrs-tracker/logger`): stdout unless specs pass a `destination`. */
export function createServerLogger(destination?: CreateLoggerOptions['destination']): Logger {
  return createLogger({ destination });
}

export const logger = createServerLogger();
