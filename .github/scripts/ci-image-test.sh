#!/usr/bin/env bash
# MCP server CI (mcp-server.yml): runs image $1 the way the pod does (UID 10001, read-only root filesystem, a
# git-sync-style checkout mounted read-only) and checks it with deploy-smoke-test.sh, then that it indexed the checkout
# and reports it on /metrics. Runs from the repo root.
# -e like GitHub's default `run` shell (bash -e), which a script run from it doesn't inherit
set -e

image=$1
name=claude-kb-mcp-ci
# git-sync's layout: the checkout in .worktrees/<hash>, and the kb link pointing at it
git_root=$(mktemp -d)
mkdir -p "$git_root/.worktrees/0123abc"
cp -r topics INDEX.md "$git_root/.worktrees/0123abc/"
ln -s .worktrees/0123abc "$git_root/kb"
chmod -R a+rX "$git_root"
entries=$(cat topics/kb-*.md | grep -c -E '^## \[[A-Z]+-[0-9]+\]')

docker run -d --name "$name" -p 127.0.0.1:8000:8000 -p 127.0.0.1:9090:9090 --read-only --tmpfs /tmp \
  --cap-drop ALL --security-opt no-new-privileges -v "$git_root:/git:ro" "$image" > /dev/null
trap 'docker logs "$name"; docker rm -f "$name" > /dev/null' EXIT

for _ in $(seq 30); do
  curl -s -o /dev/null --max-time 2 http://127.0.0.1:8000/healthz && break
  sleep 1
done
.github/scripts/deploy-smoke-test.sh http://127.0.0.1:8000
# The server indexes the checkout as it starts; allow a slow runner a few seconds for the log line
indexed=
for _ in $(seq 10); do
  if docker logs "$name" 2>&1 | grep -q "Indexed commit 0123abc: $entries entries"; then
    indexed=1
    break
  fi
  sleep 1
done
if [ -z "$indexed" ]; then
  echo "::error::No 'Indexed commit 0123abc: $entries entries' in the server's log"
  exit 1
fi
echo "Indexed the checkout: $entries entries"
# The metrics port (metrics.ts), as Alloy scrapes it. The Prometheus client prints whole numbers without a decimal point.
if ! curl -s --max-time 5 http://127.0.0.1:9090/metrics | grep -q -x "kb_index_entries $entries"; then
  echo "::error::/metrics on port 9090 doesn't report kb_index_entries $entries"
  exit 1
fi
echo "/metrics reports kb_index_entries $entries"
