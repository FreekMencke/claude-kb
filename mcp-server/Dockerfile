# claude-kb's MCP server. Built from the repo root (`docker build -f mcp-server/Dockerfile .`) because it also needs
# scripts/kb-parse.ts and scripts/difflib.ts. Holds the server and its dependencies only: never KB content (topics/ and
# the rest arrive at run time through the git-sync sidecar) and never secrets. Dockerfile.dockerignore keeps everything
# else out of the build context. The repo's layout (mcp-server/, scripts/, assets/) is kept, so the relative imports
# work unchanged. Node runs the .ts files as they are (type stripping): no build stage.
# The Node apps' base image and digest (osrs-tracker-api, osrs-tracker-web, freek-mencke-web); the major is .node-version's
FROM node:24-alpine@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1

ENV NODE_ENV=production

WORKDIR /app/mcp-server

# Exact versions from the lockfile: an unpinned dependency can break the server on a rebuild
COPY mcp-server/package.json mcp-server/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY mcp-server/server.ts mcp-server/kb-index.ts mcp-server/kb-tools.ts mcp-server/log.ts mcp-server/metrics.ts mcp-server/shutdown.ts ./
COPY scripts/package.json scripts/kb-parse.ts scripts/difflib.ts ../scripts/
# The server's icon (ICON_FILES in server.ts)
COPY assets/logo.png assets/logo.svg ../assets/

# The app, and /metrics (metrics.ts)
EXPOSE 8000 9090

# A fixed non-root UID, which the manifest's runAsUser repeats
USER 10001:10001

CMD ["node", "server.ts"]
