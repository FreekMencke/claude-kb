# claude-kb's MCP server. Built from the repo root (`docker build -f mcp-server/Dockerfile .`) because it also needs
# scripts/kb-parse.ts. Holds the server only: never KB content (topics/ and the rest arrive at
# run time through the git-sync sidecar) and never secrets. Dockerfile.dockerignore keeps everything else out of the
# build context. rspack bundles the server and node_modules into one file (build.ts), like osrs-tracker-api, so the
# image ships no node_modules; the repo's layout (mcp-server/, assets/) is kept, so server.ts finds the icons.
# The Node apps' base image and digest (osrs-tracker-api, osrs-tracker-web, freek-mencke-web); the major is .node-version's
FROM node:24-alpine@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1 AS build

WORKDIR /app/mcp-server

# Exact versions from the lockfile: an unpinned dependency can break the server on a rebuild
COPY mcp-server/package.json mcp-server/package-lock.json ./
RUN npm ci --ignore-scripts

COPY mcp-server/build.ts mcp-server/server.ts mcp-server/mcp.ts mcp-server/kb-index.ts mcp-server/kb-tools.ts mcp-server/log.ts mcp-server/metrics.ts mcp-server/shutdown.ts ./
COPY scripts/package.json scripts/kb-parse.ts ../scripts/
RUN npm run build

FROM node:24-alpine@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1 AS production

ENV NODE_ENV=production

WORKDIR /app/mcp-server

COPY --from=build /app/mcp-server/dist/server.mjs ./
# The server's icon (ICON_FILES in server.ts)
COPY assets/logo.png assets/logo.svg ../assets/

# The app, and /metrics (metrics.ts)
EXPOSE 8000 9090

# A fixed non-root UID, which the manifest's runAsUser repeats
USER 10001:10001

# Lite mode turns off V8's optimizing compilers and keeps the heap small: 72 MiB at idle and 80 MiB at most under
# bursts of 1,500 calls, against 83 and 115 without it, for calls about 1.5x slower (still under a millisecond). Over 24
# re-indexes (new KB commits) it stayed at 78 to 80 MiB, where without it it climbed to 135-160. Measured 2026-10-16. It
# also turns off WebAssembly, which Node's type stripping needs, so it runs the bundle only: never the .ts files.
CMD ["node", "--lite-mode", "server.mjs"]
