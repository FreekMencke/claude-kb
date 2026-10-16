/**
 * Prometheus metrics (FreekMencke/claude-kb#136), served on their own port (9090), which the Ingress never routes.
 *
 * `http_request_duration_seconds` and `up` come from `@osrs-tracker/express-metrics`, as in the Node apps, with the
 * same names, labels and buckets, plus the Node process metrics (`process_*`, `nodejs_*`). `path` is the matched
 * route's template (`routeLabel`), so their dashboard queries work here too. Alloy drops histogram buckets on the way
 * to Grafana Cloud, so the histograms arrive as `_sum` and `_count`: averages, not percentiles.
 */
import { Counter, Gauge, Histogram, metricsMiddleware, register } from '@osrs-tracker/express-metrics';
import type { Request, RequestHandler, Router } from 'express';
import type { Index } from './kb-index.ts';

export const TOOLS = ['kb_search', 'kb_get', 'kb_quick_answers', 'kb_status'] as const;
export type ToolName = (typeof TOOLS)[number];
// The path label for requests no route matches, so scanners can't add a series per path
export const OTHER = 'other';

// Created unregistered: metricsMiddleware clears the registry first, so httpMetrics adds these after it
export const toolCalls = new Counter({
  name: 'kb_tool_calls_total',
  help: 'Tool calls, by tool and outcome (ok or error)',
  labelNames: ['tool', 'outcome'],
  registers: [],
});
const toolDuration = new Histogram({
  name: 'kb_tool_duration_seconds',
  help: 'Time a tool call took',
  labelNames: ['tool'],
  registers: [],
});
export const searchEmpty = new Counter({
  name: 'kb_search_empty_total',
  help: 'kb_search calls that matched no entry',
  registers: [],
});
const indexEntries = new Gauge({ name: 'kb_index_entries', help: 'Entries in the loaded index', registers: [] });
const indexBuildSeconds = new Gauge({
  name: 'kb_index_build_seconds',
  help: 'How long the loaded index took to build',
  registers: [],
});
const indexBuilt = new Gauge({
  name: 'kb_index_built_timestamp_seconds',
  help: 'When the loaded index was built, as a Unix time',
  registers: [],
});

// Every tool and outcome from the start, so a rate over the first calls isn't missing its zero
for (const tool of TOOLS) for (const outcome of ['ok', 'error']) toolCalls.inc({ tool, outcome }, 0);

/** The route template a request matched, such as `/mcp`, or `other`: the `path` label and the request log's `route`. */
export function routeLabel(req: Request): string {
  const path: unknown = req.route?.path;
  return typeof path === 'string' ? path : OTHER;
}

/** Records each request and serves the registry as `GET /metrics` from `metricsApp`. */
export function httpMetrics(metricsApp: Pick<Router, 'get'>): RequestHandler {
  const middleware = metricsMiddleware({ metricsApp, normalizePath: req => routeLabel(req) });
  for (const metric of [toolCalls, toolDuration, searchEmpty, indexEntries, indexBuildSeconds, indexBuilt]) {
    register.registerMetric(metric);
  }
  return middleware;
}

export function indexLoaded(index: Index): void {
  indexEntries.set(index.entries.size);
  indexBuildSeconds.set(index.buildSeconds);
  indexBuilt.set(index.builtAt.getTime() / 1000);
}

/** A tool's handler, counted and timed. A call whose result is `isError`, or that throws, counts as an error. */
export function timedTool<A extends unknown[], R extends { isError?: boolean }>(
  tool: ToolName,
  handler: (...args: A) => R,
): (...args: A) => R {
  return (...args) => {
    const end = toolDuration.startTimer({ tool });
    let outcome = 'error';
    try {
      const result = handler(...args);
      if (!result.isError) outcome = 'ok';
      return result;
    } finally {
      toolCalls.inc({ tool, outcome });
      end();
    }
  };
}
