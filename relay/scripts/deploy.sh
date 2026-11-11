#!/bin/sh
# The relay's deploy (docs/ops/runbook.md#8-deploy-the-live-relay): `npm run deploy` (production) or `npm run
# deploy:test` (`--env test`). Stamps the commit: `/health`'s `sha` (the COMMIT var) and the deployment's message
# (`wrangler deployments list`). Production only from a clean tree at a commit on origin/main (the relay bundles
# app/src/lib/contract too); the test copy from anything, its sha `-dirty` when the tree is.
set -eu
cd "$(dirname "$0")/.."
sha=$(git rev-parse --short HEAD)
dirty=$(git status --porcelain -- . ../app/src/lib/contract)
if [ "${1:-}" != "--env" ]; then
  if [ -n "$dirty" ]; then echo "deploy: uncommitted changes in relay/ or app/src/lib/contract (commit and push first)" >&2; exit 1; fi
  if ! git merge-base --is-ancestor HEAD origin/main; then echo "deploy: $sha is not on origin/main (push first, then git fetch)" >&2; exit 1; fi
elif [ -n "$dirty" ]; then sha="$sha-dirty"; fi
exec npx wrangler deploy "$@" --var "COMMIT:$sha" --message "$sha $(git log -1 --format=%s | cut -c1-80)"
