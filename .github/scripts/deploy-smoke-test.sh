#!/usr/bin/env bash
# CD's smoke test (deploy.yml), and CI's check of the built image (ci-image-test.sh): checks what Claude needs before
# it can sign in, at $1 (default: the public URL). Exits 1 when any check failed, after running them all.
# -e like GitHub's default `run` shell (bash -e), which a script run from it doesn't inherit
set -e

public=https://claude-kb.freekmencke.com
base=${1:-$public}
failed=0
check() {
  if [ "$2" = "$3" ]; then echo "$1: $2"; else echo "$1: $2 (expected $3)"; failed=1; fi
}

# /mcp without a token: a 401 pointing at the resource metadata, never a redirect
headers=$(curl -s -o /dev/null -D - --max-time 30 -X POST "$base/mcp" -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' --data '{"jsonrpc":"2.0","id":1,"method":"ping"}' | tr -d '\r' || true)
check "POST /mcp" "$(printf '%s\n' "$headers" | head -1 | cut -d' ' -f2)" 401
challenge=$(printf '%s\n' "$headers" | grep -i '^www-authenticate:' || true)
check "WWW-Authenticate names the resource metadata" \
  "$(printf '%s' "$challenge" | grep -c "resource_metadata=\"$public/.well-known/oauth-protected-resource/mcp\"" || true)" 1

# Both protected-resource metadata paths, whose resource must equal the URL entered in Claude
for path in /.well-known/oauth-protected-resource/mcp /.well-known/oauth-protected-resource; do
  metadata=$(curl -s --max-time 30 "$base$path" || true)
  check "$path resource" "$(printf '%s' "$metadata" | jq -r '.resource' 2>/dev/null || true)" "$public/mcp"
  check "$path authorization_servers" "$(printf '%s' "$metadata" | jq -c '.authorization_servers' 2>/dev/null || true)" \
    "[\"$public/\"]"
done

# What Claude needs before it picks CIMD over DCR
metadata=$(curl -s --max-time 30 "$base/.well-known/oauth-authorization-server" || true)
check "authorization server: S256, CIMD, public clients" "$(printf '%s' "$metadata" | jq -c '[
  .code_challenge_methods_supported == ["S256"],
  .client_id_metadata_document_supported == true,
  (.token_endpoint_auth_methods_supported | index("none") != null)
]' 2>/dev/null || true)" '[true,true,true]'

check "/healthz" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 "$base/healthz" || true)" 200
# The icon in serverInfo, fetched without credentials
check "/icon.png" "$(curl -s -o /dev/null -w '%{http_code} %{content_type}' --max-time 30 "$base/icon.png" || true)" \
  "200 image/png"
exit "$failed"
