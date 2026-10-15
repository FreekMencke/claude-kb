#!/usr/bin/env bash
# CD's commit step (deploy.yml): commits the image digest to mcp-server/claude-kb-mcp.yaml and pushes it to main. Writes
# sha=<deploy commit> to $GITHUB_OUTPUT, or nothing when the image is unchanged. Reads IMAGE, DIGEST and SOURCE_SHA;
# runs in .deploy, a checkout of main.
# -e like GitHub's default `run` shell (bash -e), which a script run from it doesn't inherit
set -e

manifest=mcp-server/claude-kb-mcp.yaml

sed -i -E "s#^( *image: $IMAGE)@sha256:[0-9a-f]{64}\$#\1@$DIGEST#" "$manifest"
if ! grep -q -E "^ *image: $IMAGE@$DIGEST\$" "$manifest"; then
  echo "::error::Couldn't find the image: line in $manifest"
  exit 1
fi

# Docker builds the same image when nothing in it changed: then there's nothing to deploy or check
if git diff --quiet -- "$manifest"; then
  echo "The image is unchanged ($DIGEST), skipping the deploy commit."
  exit 0
fi

git config user.name 'github-actions[bot]'
git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
git add "$manifest"
# The Deployed-from trailer tells later runs what's live. CI ignores pushes that only change the manifest, so this
# commit starts no second deploy; if it did, the plan step would skip it.
git commit --quiet -m "chore(deploy): deploy ${DIGEST:0:15}" -m "Deployed-from: $SOURCE_SHA"

# If main moved meanwhile, rebase and retry once. A conflict (someone changed the image line) fails the job.
if ! git push origin HEAD:main; then
  git pull --rebase origin main
  git push origin HEAD:main
fi
echo "sha=$(git rev-parse HEAD)" >> "$GITHUB_OUTPUT"
