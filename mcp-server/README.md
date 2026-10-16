# claude-kb MCP server

A remote, read-only MCP server that serves this knowledge base to claude.ai (as a custom connector) and Claude Code,
at `https://claude-kb.freekmencke.com/mcp`, from the home cluster, without a sign-in. Plan: roadmap
FreekMencke/claude-kb#109.

## Tools

All read-only, returning plain text with entry IDs and a last `corpus: <commit>` line (FreekMencke/claude-kb#112).

| Tool | Arguments | Returns | Cap |
|---|---|---|---|
| `kb_search` | `query`; optional `topic` (`mcp` or `MCP`), `type`, `limit` 1 to 20 (default 8) | One block per hit: `ID: title (type, confidence, last verified date)`, flagged when over 60 days old, then the entry's summary (at most 300 characters). Named IDs come first. No hits: says so and lists the topics | 8,000 characters (8 hits are about 3 KB) |
| `kb_get` | `ids`: 1 to 10 IDs, any case, `mcp-17` works | Each entry's full Markdown, separated by `---`; a merged entry brings the entry it points to; an unknown ID gets a line with the closest IDs (an error only when none was found) | 40,000 characters, about 10,000 tokens, where Claude Code starts warning (ten of the longest entries are 28,000) |
| `kb_quick_answers` | optional `topic` | `INDEX.md`'s Quick answers and the topic list; for a topic, its Quick answers and its Recommendations for our setup | None needed: 18 KB for `INDEX.md` |
| `kb_status` | none | The synced commit, the entry count and when and how fast it was indexed | |

A cap cuts whole entries or hits and names the IDs it cut. A bad argument returns `isError: true` with what to pass
instead. The usage rules (search first, then `kb_get` the 1 to 4 best IDs; cite IDs; check entries last verified over
60 days ago) are in `kb_search`'s description and in the server `instructions`: claude.ai web and desktop drop
`instructions` (anthropics/claude-ai-mcp#93), Claude Code keeps them. Keep the descriptions stable: claude.ai's "Always
allow" is reported to be keyed on their hash (anthropics/claude-ai-mcp#1087).

## Files

| File | What it is |
|---|---|
| `server.ts` | The server: Express, the KB index's refresh, the `/mcp`, icon and health routes, the run modes |
| `mcp.ts` | MCP itself, without the SDK: stateless Streamable HTTP with JSON replies, the 2025 protocol revisions, the tools' schemas and descriptions, argument checks |
| `kb-tools.ts` | The text each tool returns, its caps and its error messages |
| `kb-index.ts` | The entries, parsed by `scripts/kb-parse.ts`, and their search: SQLite FTS5 in memory (`node:sqlite`), ranked by `bm25()` |
| `log.ts` | The logger: `@osrs-tracker/logger`, the Node apps' JSON lines |
| `metrics.ts` | Prometheus metrics on port 9090: `@osrs-tracker/express-metrics` for HTTP requests, plus tool calls, empty searches, the index |
| `shutdown.ts` | Graceful shutdown on `SIGTERM`, as osrs-tracker-web does it |
| `tests/` | Vitest: the HTTP contract without a token, the tools through the SDK's client over HTTP (so its version negotiation is tested too), the index and search on fixtures and on this repo, logs, metrics, and the checker (`scripts/check-kb.ts`) |
| `build.ts` | The rspack bundle the image runs: the server and all of `node_modules` in `dist/server.mjs` (`npm run build`), like osrs-tracker-api |
| `Dockerfile`, `Dockerfile.dockerignore` | The image: a build stage runs `build.ts`, and the image holds `server.mjs` and `assets/logo.{png,svg}` only, no `node_modules`, never KB content or secrets |
| `package.json`, `package-lock.json` | Dependencies, pinned by the lockfile; `engines` and the repo's `.node-version` name Node 24 |
| `tsconfig.json` | The type check (`npx tsc`), which covers `../scripts` too; nothing is emitted |
| `claude-kb-mcp.yaml` | The Kubernetes manifest, the only file Flux reads from this repo |

The deploy workflows are in the repo's `.github/`: `workflows/mcp-server.yml` (CI), `workflows/deploy.yml` (CD) and
`scripts/`.

## How it works

- **Content.** A git-sync sidecar keeps a checkout of `main` in a volume shared with the server, and points the link
  `/git/kb` at it; "the basename of the target of the link is the current hash". Every 10 s the server checks the link
  on a timer and re-indexes when the commit changed, never in a request. A KB push reaches the server in
  about a minute, with no image build.
- **Index.** `kb-index.ts`'s `load` parses the checkout with `scripts/kb-parse.ts` (one parser for CI's checker and
  the server) into an immutable `Index`: every entry's fields, the Quick answers of `INDEX.md` and each topic file, and
  each file's Recommendations. The server builds a new one and swaps it in with one assignment, so a request reads
  the old index or the new one, whole. Building all 580 entries took 0.07 s on 2026-10-16 in WSL; the build blocks
  the event loop that long, once per KB push.
- **Search.** Node's built-in `node:sqlite`, FTS5 with Porter stemming, ranked by `bm25()` with column weights (ID 10, title
  3, tags 2, body 1). Entry IDs named in the query come first, then entries matching any of its words. Every word is
  quoted before `MATCH`, so `(`, `-` or `"` in a query never raise. Merged entries are found by ID only. The weights
  and OR matching were tuned on the Quick-answer questions: 208 of 253 found an entry their row cites in the top 5 on
  2026-10-15; `tests/kb-index.test.ts` fails below 75%.
- **Access.** No sign-in: the knowledge base is a public repo, so the server is open and read-only
  (FreekMencke/claude-kb#142, 2026-10-15). `/mcp` answers without a token, and there is no OAuth metadata, so Claude
  connects without signing in. The Ingress's Traefik Middlewares rate-limit each client IP (20 requests a second,
  bursts of 200) and drop a client-sent `Forwarded` header. Until then a GitHub sign-in let only the owner in; the
  history before #142 has it.
- **Icon.** `serverInfo.icons` lists `assets/logo.png` and `logo.svg`, served by the server itself at `/icon.png` and
  `/icon.svg` (and the PNG at `/favicon.ico`) without a token: the MCP spec asks clients to fetch icons only from the
  server's own origin. Claude's docs say a custom connector appears as "Custom", so claude.ai may show its generic
  icon anyway.
- **Metrics** (FreekMencke/claude-kb#136). `/metrics` on port 9090, which neither the Service nor the Ingress routes;
  the pod's `prometheus.io/*` annotations have Alloy scrape it once a minute into Grafana Cloud, like the Node apps.
  - `http_request_duration_seconds{method,path,status_code}` and `up`, from `@osrs-tracker/express-metrics` as in the
    Node apps, so their dashboard queries work here. `path` is the matched route's template; every unmatched path is
    `other`. `/healthz` is answered before the middleware, so the probes aren't counted (nor logged).
  - `kb_tool_calls_total{tool,outcome}` (`ok` or `error`) and `kb_tool_duration_seconds{tool}`, around each tool's
    handler; `kb_search_empty_total` counts searches that matched nothing. A call with bad arguments counts as an
    `error`; a call to an unknown tool isn't counted.
  - `kb_index_entries`, `kb_index_build_seconds` and `kb_index_built_timestamp_seconds`, set on each re-index.
  - The client's defaults: `process_*` (memory, CPU, open files) and `nodejs_*` (heap, event-loop lag, GC).
  - git-sync's own metrics on port 2020, through the `claude-kb-git-sync-metrics` Service (a pod's annotations name one
    port): `git_sync_count_total{status}`, where `status` is `success` (a new commit), `noop` or `error`. Only these
    tell a quiet repo from a stuck sync.

  Alloy drops histogram buckets, so durations are averages (`_sum / _count`), not percentiles. Container memory and
  CPU, restarts and OOM kills come from cAdvisor and kube-state-metrics, and home-cluster's cluster-wide alert rules
  cover the Deployment.
- **Protocol** (`mcp.ts`). JSON-RPC over `POST /mcp`, answered as JSON: `initialize`, `ping`, `tools/list` and
  `tools/call`, the 2025 revisions (2024-11-05 to 2025-11-25), no session and no stream, so `GET` and `DELETE` get 405.
  An unsupported `MCP-Protocol-Version` header gets 400, as the spec requires. A 2026-07-28 client probes with
  `server/discover` under its own version header, gets that 400 and falls back to `initialize`, as the SDK's client
  does in the tests. Hand-written because the official SDK (v2) builds a server per request: it cost
  about 20 MiB at idle and peaked at 275 MiB instead of 110 under a burst of 50 parallel calls (2026-10-16).
- **Tools** have a `title`, `readOnlyHint: true`, `destructiveHint: false`, and return text content only, with no
  output schema: with one, Claude Code hands Claude the JSON instead of the text. Arguments are checked by type in
  `mcp.ts` and by bounds in `kb-tools.ts`, so a bad value gets an `isError` result saying what to pass.
- **Code.** Node 24 runs the `.ts` files as they are (type stripping) in tests and local runs, so only erasable syntax
  (no `enum`, no parameter properties), relative imports with their `.ts` extension. The image runs an rspack bundle
  (`build.ts`) with `node --lite-mode`, which turns off V8's optimizing compilers: on 2026-10-16 it idled at 72 MiB and
  peaked at 80 MiB under bursts of 1,500 calls 50 at a time, where the `.ts` files with the SDK idled at 136 MiB and
  peaked over 330. Calls are about 1.5x slower in lite mode, still under a millisecond. Moved from Python and FastMCP
  on 2026-10-16 (FreekMencke/claude-kb#146).

## Run and test locally

Node 24 (`.node-version`). From `mcp-server/`:

```bash
npm ci
```

The type check and the tests, which are the verify command for any change here:

```bash
npx tsc && npm test
```

On 127.0.0.1 only, reading the checkout it runs from (`kb_status` shows its directory name as the commit), without
the metrics port:

```bash
node server.ts --local --port 8765
```

The bundle the image runs, in `dist/server.mjs` (it finds the icons only in the image's layout, `../assets`):

```bash
npm run build
```

Then, from another terminal, the MCP Inspector CLI:

```bash
npx @modelcontextprotocol/inspector --cli http://127.0.0.1:8765/mcp --transport http --method tools/list
```

```bash
npx @modelcontextprotocol/inspector --cli http://127.0.0.1:8765/mcp --transport http --method tools/call --tool-name kb_search --tool-arg query=MCP-017
```

```bash
npx @modelcontextprotocol/inspector --cli http://127.0.0.1:8765/mcp --transport http --method tools/call --tool-name kb_get --tool-arg 'ids=["MCP-017"]'
```

The image, run the way the pod runs it and checked like CI does (from the repo root, with Docker running):

```bash
docker build -f mcp-server/Dockerfile -t claude-kb-mcp:ci . && .github/scripts/ci-image-test.sh claude-kb-mcp:ci
```

## Configuration

Read from the environment, set in the manifest. No secrets.

| Variable | What it is |
|---|---|
| `KB_LINK` | git-sync's link (default `/git/kb`) |
| `PORT` | Default 8000; `--port` overrides it |

## Dependencies

`package-lock.json` pins every version, and the image's build stage installs from it with `npm ci`: an unpinned
dependency once jumped a major version and broke another server's startup. Change one with `npm install <name>@<range>`
from `mcp-server/` and commit both files. The image's base (`node:24-alpine`, by digest) is the Node apps' own; Node's
major version is in `.node-version`, `engines`, both workflows (`setup-node` reads `.node-version`) and that tag.

TypeScript is 7, the native compiler, used only for `npx tsc` (Node strips the types, and rspack's SWC loader compiles
the bundle). Its package has no `tsserver` or `lib.*.d.ts`, so an editor or language server pointed at this folder's
`typescript` reports every built-in as missing: use the editor's own TypeScript, or none.

## Deploy

Merging to `main` deploys, as for freek-mencke-web. CI (`MCP server`) runs only when the server, its workflows,
`scripts/` or `.node-version` change. When it passes on `main`, CD builds the image, pushes it to Docker Hub
(`freekmencke/claude-kb-mcp`, public: it holds no KB content), commits its digest to `claude-kb-mcp.yaml`, waits for
Flux's `Flux / sync` status and smoke-tests the public URL. A change to files outside the image (`NOT_IN_IMAGE` in
`deploy.yml`) builds nothing. Change the cluster only through this repo, as Flux reverts anything else. To roll back,
`git revert` the `chore(deploy)` commit and push.

Flux may only apply Deployments, Services, Ingresses, Traefik Middlewares and PodDisruptionBudgets in the `claude-kb`
namespace. Anything else (a ConfigMap, a Secret, a volume claim) fails the deploy with "forbidden" until it's added to
the Role in FreekMencke/home-cluster `cluster/claude-kb/flux.yaml`.

CD needs the repository secrets `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`.

## Connecting

Before connecting (from outside the LAN, such as a phone hotspot or a cloud session): run
`.github/scripts/deploy-smoke-test.sh` and check the `A` record. "There is no separate staging environment, so you
test in production."

- **claude.ai** (web, desktop, phone): Customize > Connectors > Add custom connector, URL
  `https://claude-kb.freekmencke.com/mcp`, no OAuth settings. You can't change its authentication settings after
  adding it: a connector added while the server still had a sign-in (before 2026-10-15) has to be removed and re-added.
- **Claude Code** at user scope (needed in desktop WSL sessions):

  ```bash
  claude mcp add --transport http --scope user claude-kb https://claude-kb.freekmencke.com/mcp
  ```

## Debugging

The server logs JSON lines to stdout (`kubectl -n claude-kb logs deploy/claude-kb-mcp -c claude-kb-mcp`) with
`@osrs-tracker/logger`, as the Node apps do (`log.ts`): `level` (pino's names), `time`, `type`, `message`, and `error`
with its stack. `type` is `incoming` (a request), `lifecycle` (startup and shutdown), `uncaught` (an error that reached
Express's error handler) or `index`. In Grafana Cloud: `{app="claude-kb-mcp", job="claude-kb/claude-kb-mcp"} | json`,
or the logs panel of the MCP Server Dashboard.

- Each request but the `/healthz` probes has a `type: incoming` line with `method`, `route` (the metric's `path`),
  `url`, `status`, `responseTime`, `clientIp` (from Traefik's `X-Forwarded-For`), `userAgent`, `host`, `referer` and
  `contentLength`; a 4XX is `warn`, a 5XX `error`.
- `Indexed commit <hash>: <n> entries in <s> s` (`type: index`) follows each new commit from git-sync; git-sync's own
  log is container `git-sync`.
- Metrics, in Grafana Cloud's Explore: `sum by (tool, outcome) (increase(kb_tool_calls_total[1d]))` for use,
  `increase(kb_search_empty_total[7d])` for misses, `increase(git_sync_count_total{namespace="claude-kb"}[1h])` for
  the sync. `.github/scripts/ci-image-test.sh` checks the endpoint on a local container.
