#!/bin/sh
# The gym bot's deploy (README.md "Deploy"): `npm run deploy`. Only from a clean gym/ at a commit on origin/main, so
# what runs is what's in the repo (MODE too: it lives in wrangler.toml). Stamps the commit: /health's `sha` (the COMMIT
# var) and the deployment's message (`npx wrangler deployments list`).
set -eu
cd "$(dirname "$0")/.."
sha=$(git rev-parse --short HEAD)
if [ -n "$(git status --porcelain -- .)" ]; then echo "deploy: uncommitted changes in gym/ (commit and push first)" >&2; exit 1; fi
if ! git merge-base --is-ancestor HEAD origin/main; then echo "deploy: $sha is not on origin/main (push first, then git fetch)" >&2; exit 1; fi
exec npx wrangler deploy "$@" --var "COMMIT:$sha" --message "$sha $(git log -1 --format=%s | cut -c1-80)"
