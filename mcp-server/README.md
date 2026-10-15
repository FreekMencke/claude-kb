# claude-kb MCP server

A remote, read-only MCP server that serves this knowledge base to claude.ai (as a custom connector) and Claude Code,
at `https://claude-kb.freekmencke.com/mcp`, from the home cluster. Plan: roadmap FreekMencke/claude-kb#109.

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
| `server.py` | The server: FastMCP, stateless Streamable HTTP at `/mcp`, GitHub sign-in for the owner only, the tools' signatures and descriptions |
| `kb_tools.py` | The text each tool returns, its caps and its error messages |
| `kb_index.py` | The entries, parsed by `scripts/check_kb.py`, and their search: SQLite FTS5 in memory, ranked by `bm25()` |
| `metrics.py` | Prometheus metrics on port 9090: HTTP requests, tool calls, empty searches, the index |
| `tests/` | pytest, with a fake GitHub: sign-in, the owner gate, discovery metadata, redirect URIs; the tools through FastMCP's in-memory client; the index and search on fixtures and on this repo |
| `Dockerfile`, `Dockerfile.dockerignore` | The image: `server.py`, `kb_tools.py`, `kb_index.py`, `metrics.py`, `scripts/check_kb.py`, `assets/logo.{png,svg}` and the pinned dependencies, never KB content or secrets |
| `requirements.in`, `requirements-dev.in` | Direct dependencies, compiled to `requirements*.txt` with exact versions and hashes |
| `claude-kb-mcp.yaml` | The Kubernetes manifest, the only file Flux reads from this repo |
| `pyproject.toml` | Python version and pytest settings |

The deploy workflows are in the repo's `.github/`: `workflows/mcp-server.yml` (CI), `workflows/deploy.yml` (CD) and
`scripts/`.

## How it works

- **Content.** A git-sync sidecar keeps a checkout of `main` in a volume shared with the server, and points the link
  `/git/kb` at it; "the basename of the target of the link is the current hash". Every 10 s the server checks the link
  in a background task and re-indexes when the commit changed, never in a request. A KB push reaches the server in
  about a minute, with no image build.
- **Index.** `kb_index.load` parses the checkout with `check_kb.py`'s own functions (one parser for CI's checker and
  the server) into an immutable `Index`: every entry's fields, the Quick answers of `INDEX.md` and each topic file, and
  each file's Recommendations. The server builds a new one and swaps it in with one assignment, so a request reads
  the old index or the new one, whole. Building all 575 entries took 0.05 s on 2026-10-15, in WSL and in the image.
- **Search.** Python's own `sqlite3`, FTS5 with Porter stemming, ranked by `bm25()` with column weights (ID 10, title
  3, tags 2, body 1). Entry IDs named in the query come first, then entries matching any of its words. Every word is
  quoted before `MATCH`, so `(`, `-` or `"` in a query never raise. Merged entries are found by ID only. The weights
  and OR matching were tuned on the Quick-answer questions: 208 of 253 found an entry their row cites in the top 5 on
  2026-10-15; `tests/test_kb_index.py` fails below 75%.
- **Sign-in.** FastMCP's `GitHubProvider` is an OAuth proxy: the server is the authorization server Claude sees, with
  CIMD and DCR, PKCE (S256) and a consent page, and GitHub is the login behind it. Its state (clients, codes, the
  GitHub tokens) is in `STATE_DIR` on a volume, encrypted with `STORAGE_ENCRYPTION_KEY`, so a restart signs nobody out.
- **The owner gate.** Only the GitHub account whose numeric ID is `ALLOWED_GITHUB_ID` gets anything; the login name is
  never compared. FastMCP 4.1.0 has no public hook between GitHub's callback and the code it hands the client, so:
  1. `OwnerOnlyGitHubProvider._handle_idp_callback` overrides a **private** FastMCP method. After FastMCP has exchanged
     GitHub's code, it asks GitHub who signed in; for anyone else it deletes the authorization code and answers 403,
     so a stranger never gets a token.
  2. `load_access_token` (public API, run on every request) returns nothing for a token whose GitHub account isn't the
     owner's, so a FastMCP upgrade that changes the private method still leaves strangers with a 401.

  `tests/test_auth.py` fails if either check stops working. After a FastMCP upgrade, read its `_handle_idp_callback`
  and the tests' result before deploying.
- **Discovery.** `/mcp` without a token is a 401 with `WWW-Authenticate: Bearer ... resource_metadata=...`. The
  protected-resource metadata is served at `/.well-known/oauth-protected-resource/mcp` (FastMCP) and at the root path
  (added in `create_app`), both with `resource` `https://claude-kb.freekmencke.com/mcp`.
- **Icon.** `serverInfo.icons` lists `assets/logo.png` and `logo.svg`, served by the server itself at `/icon.png` and
  `/icon.svg` (and the PNG at `/favicon.ico`) without a token: the MCP spec asks clients to fetch icons only from the
  server's own origin. Claude's docs say a custom connector appears as "Custom", so claude.ai may show its generic
  icon anyway.
- **Metrics** (FreekMencke/claude-kb#136). `/metrics` on port 9090, which neither the Service nor the Ingress routes;
  the pod's `prometheus.io/*` annotations have Alloy scrape it once a minute into Grafana Cloud, like the Node apps.
  - `http_request_duration_seconds{method,route,status_code}`: the Node apps' name and labels. `route` is the matched
    route's template; every unmatched path is `other`.
  - `kb_tool_calls_total{tool,outcome}` (`ok` or `error`) and `kb_tool_duration_seconds{tool}`, from a FastMCP
    middleware; `kb_search_empty_total` counts searches that matched nothing.
  - `kb_index_entries`, `kb_index_build_seconds` and `kb_index_built_timestamp_seconds`, set on each re-index.
  - The client's defaults: `process_*` (memory, CPU, open files) and `python_gc_*`.
  - git-sync's own metrics on port 2020, through the `claude-kb-git-sync-metrics` Service (a pod's annotations name one
    port): `git_sync_count_total{status}`, where `status` is `success` (a new commit), `noop` or `error`. Only these
    tell a quiet repo from a stuck sync.

  Alloy drops histogram buckets, so durations are averages (`_sum / _count`), not percentiles. Container memory and
  CPU, restarts and OOM kills come from cAdvisor and kube-state-metrics, and home-cluster's cluster-wide alert rules
  cover the Deployment.
- **Tools** have a `title`, `readOnlyHint: true`, `destructiveHint: false`, and return text content only, with no
  output schema: with one, Claude Code hands Claude the JSON instead of the text. FastMCP logs a failed call as
  `Error calling tool '<name>'`, without its arguments or result.

## Run and test locally

Python 3.13. From `mcp-server/`:

```bash
python3.13 -m venv .venv
```

```bash
.venv/bin/pip install --require-hashes -r requirements-dev.txt
```

The tests, which are the verify command for any change here:

```bash
.venv/bin/python -m pytest
```

Without sign-in, on 127.0.0.1 only, reading the checkout it runs from (`kb_status` shows its directory name as the
commit):

```bash
.venv/bin/python server.py --local --port 8765
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

Read from the environment; in the cluster, from the `claude-kb-mcp-oauth` Secret (FreekMencke/home-cluster
`cluster/claude-kb/secrets.example.yaml`).

| Variable | What it is |
|---|---|
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | The GitHub OAuth App, whose callback is `https://claude-kb.freekmencke.com/auth/callback` |
| `JWT_SIGNING_KEY` | Signs the tokens the server issues |
| `STORAGE_ENCRYPTION_KEY` | A Fernet key for the state in `STATE_DIR`. Changing it signs everyone out |
| `ALLOWED_GITHUB_ID` | The owner's numeric GitHub ID (`gh api user --jq .id`) |
| `KB_LINK` | git-sync's link (default `/git/kb`) |
| `STATE_DIR` | The OAuth state (default `/state`, the `claude-kb-mcp-state` volume) |
| `PUBLIC_URL` | Default `https://claude-kb.freekmencke.com` |

## Dependencies

Pinned exactly, with hashes: an unbounded `mcp` dependency jumped to SDK 2.0 and broke another server's startup. To
change one, edit the `.in` file and recompile both (needs `uv`), from `mcp-server/`:

```bash
uv pip compile requirements.in --python-version 3.13 --python-platform x86_64-unknown-linux-gnu --generate-hashes -o requirements.txt
```

```bash
uv pip compile requirements-dev.in --python-version 3.13 --python-platform x86_64-unknown-linux-gnu --generate-hashes -o requirements-dev.txt
```

## Deploy

Merging to `main` deploys, as for freek-mencke-web. CI (`MCP server`) runs only when the server, its workflows or
`scripts/check_kb.py` change. When it passes on `main`, CD builds the image, pushes it to Docker Hub
(`freekmencke/claude-kb-mcp`, public: it holds no KB content), commits its digest to `claude-kb-mcp.yaml`, waits for
Flux's `Flux / sync` status and smoke-tests the public URL. A change to files outside the image (`NOT_IN_IMAGE` in
`deploy.yml`) builds nothing. Change the cluster only through this repo, as Flux reverts anything else. To roll back,
`git revert` the `chore(deploy)` commit and push.

Flux may only apply Deployments, Services, Ingresses, Traefik Middlewares and PodDisruptionBudgets in the `claude-kb`
namespace. Anything else (a ConfigMap, a Secret, a volume claim) fails the deploy with "forbidden" until it's added to
the Role in FreekMencke/home-cluster `cluster/claude-kb/flux.yaml`; the Secrets and the state volume are made there.

CD needs the repository secrets `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`.

## Connecting

Before connecting (from outside the LAN, such as a phone hotspot or a cloud session): `curl -i` the URL (a 401 or 405,
never a redirect), the two metadata documents and the `A` record. `.github/scripts/deploy-smoke-test.sh` runs the
HTTP checks. "There is no separate staging environment, so you test in production."

- **claude.ai** (web, desktop, phone): Customize > Connectors > Add custom connector, URL
  `https://claude-kb.freekmencke.com/mcp`. You can't change its authentication settings after adding it: remove and
  re-add it.
- **Claude Code** at user scope (needed in desktop WSL sessions):

  ```bash
  claude mcp add --transport http --scope user claude-kb https://claude-kb.freekmencke.com/mcp
  ```

  ```bash
  claude mcp login claude-kb
  ```

## Debugging

The server logs to stdout (`kubectl -n claude-kb logs deploy/claude-kb-mcp -c claude-kb-mcp`):

- uvicorn's access log has the client address (from Traefik's `X-Forwarded-For`), the path and the status. A
  `GET /authorize?client_id=https%3A%2F%2Fclaude.ai%2Foauth%2F...` means Claude used CIMD; a `POST /register` before it
  means DCR.
- `Sign-in granted to GitHub ID ...` and `Sign-in refused: GitHub ID ... isn't the owner` record the gate.
- `Indexed commit <hash>: <n> entries in <s> s` follows each new commit from git-sync; git-sync's own log is container
  `git-sync`.
- Metrics, in Grafana Cloud's Explore: `sum by (tool, outcome) (increase(kb_tool_calls_total[1d]))` for use,
  `increase(kb_search_empty_total[7d])` for misses, `increase(git_sync_count_total{namespace="claude-kb"}[1h])` for
  the sync. `.github/scripts/ci-image-test.sh` checks the endpoint on a local container.
