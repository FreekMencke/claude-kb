#!/usr/bin/env bash
# MCP server CI (mcp-server.yml): runs image $1 the way the pod does (UID 10001, read-only root filesystem, a 0700
# state directory, a git-sync-style checkout mounted read-only) and checks it with deploy-smoke-test.sh, then that it
# indexed the checkout. Runs from the repo root.
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

docker run -d --name "$name" -p 127.0.0.1:8000:8000 --read-only --tmpfs /tmp \
  --tmpfs /state:uid=10001,gid=10001,mode=700 --cap-drop ALL --security-opt no-new-privileges \
  -v "$git_root:/git:ro" -e GITHUB_CLIENT_ID=ci -e GITHUB_CLIENT_SECRET=ci \
  -e JWT_SIGNING_KEY="$(openssl rand -hex 32)" -e STORAGE_ENCRYPTION_KEY="$(openssl rand -base64 32 | tr '+/' '-_')" \
  -e ALLOWED_GITHUB_ID=1 "$image" > /dev/null
trap 'docker logs "$name"; docker rm -f "$name" > /dev/null' EXIT

for _ in $(seq 30); do
  curl -s -o /dev/null --max-time 2 http://127.0.0.1:8000/healthz && break
  sleep 1
done
.github/scripts/deploy-smoke-test.sh http://127.0.0.1:8000
# The index builds in a background task after startup (0.18 s on a runner), so /healthz can answer before it's done
for _ in $(seq 10); do
  if docker logs "$name" 2>&1 | grep -q "Indexed commit 0123abc: $entries entries"; then
    echo "Indexed the checkout: $entries entries"
    exit 0
  fi
  sleep 1
done
echo "::error::No 'Indexed commit 0123abc: $entries entries' in the server's log"
exit 1
