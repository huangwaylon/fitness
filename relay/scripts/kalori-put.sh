#!/bin/sh
# Kalori's chain menus into the relay's KV (docs/food-data.md#kalori, src/foodRoute.ts): `sh scripts/kalori-put.sh
# [--env test] [file]`, the file by default food-data/out/private/kalori.json (kalori_convert.py's). The value first
# (its metadata the version), then the version key, so a phone never revalidates against a file not yet there. The
# version: the file's sha256, 16 hex. Run from anywhere; production and the test copy each need their own upload.
set -eu
cd "$(dirname "$0")/.."
env=""
if [ "${1:-}" = "--env" ]; then env="--env $2"; shift 2; fi
file=${1:-../food-data/out/private/kalori.json}
node -e 'const d = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")); if (d.source !== "kalori" || !Array.isArray(d.items) || !d.items.length) { console.error("kalori-put: not a Kalori dataset"); process.exit(1); }' "$file"
v=$(shasum -a 256 "$file" | cut -c1-16)
# shellcheck disable=SC2086
npx wrangler kv key put kalori --binding FOOD $env --remote --path "$file" --metadata "{\"v\":\"$v\"}"
# shellcheck disable=SC2086
npx wrangler kv key put kalori:v "$v" --binding FOOD $env --remote
echo "kalori-put: $v, $(wc -c <"$file" | tr -d ' ') bytes${env:+ ($env)}"
