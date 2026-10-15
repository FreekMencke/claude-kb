#!/usr/bin/env bash
# CD's smoke test (deploy.yml), and CI's check of the built image (ci-image-test.sh): checks what Claude needs to
# connect without a sign-in, at $1 (default: the public URL). Exits 1 when any check failed, after running them all.
# -e like GitHub's default `run` shell (bash -e), which a script run from it doesn't inherit
set -e

public=https://claude-kb.freekmencke.com
base=${1:-$public}
failed=0
check() {
  if [ "$2" = "$3" ]; then echo "$1: $2"; else echo "$1: $2 (expected $3)"; failed=1; fi
}
# One JSON-RPC request to /mcp without a token; prints the JSON message, sent as JSON or as one SSE event
rpc() {
  curl -s --max-time 30 -X POST "$base/mcp" -H 'Content-Type: application/json' \
    -H 'Accept: application/json, text/event-stream' --data "$1" | tr -d '\r' | sed -n 's/^data: //p; /^{/p' | tail -1
}

check "initialize without a token" "$(rpc '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{
  "protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"smoke-test","version":"0"}}}' |
  jq -r '.result.serverInfo.name' 2>/dev/null || true)" claude-kb
check "tools/call kb_status without a token" "$(rpc '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{
  "name":"kb_status","arguments":{}}}' | jq -c '[.result.isError // false, .result.content[0].type]' 2>/dev/null ||
  true)" '[false,"text"]'

# No OAuth metadata: Claude only starts a sign-in when the server points it at some
for path in /.well-known/oauth-protected-resource/mcp /.well-known/oauth-protected-resource \
  /.well-known/oauth-authorization-server; do
  check "$path" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 "$base$path" || true)" 404
done

check "/healthz" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 "$base/healthz" || true)" 200
# The icon in serverInfo, fetched without credentials
check "/icon.png" "$(curl -s -o /dev/null -w '%{http_code} %{content_type}' --max-time 30 "$base/icon.png" || true)" \
  "200 image/png"
exit "$failed"
