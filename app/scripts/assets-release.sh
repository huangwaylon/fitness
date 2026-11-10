#!/bin/sh
# The raw sources git doesn't hold, as release assets of this repo (outside git history): the full-size ごはん
# picture generations, ききみみ's clean takes and voice references, the raw food-data downloads. Run it after a
# batch regenerates or re-downloads them; it keeps the newest 2 `assets-*` releases. Needs zstd and gh.
# Restore: gh release download <tag> -p '*' && shasum -a 256 -c SHA256SUMS && cat NAME.tar.zst.part-* | zstd -d | tar -xf - -C <dest>
set -eu
export GH_HOST=github.com
REPO=huangwaylon/fitness
HERE=$(cd "$(dirname "$0")" && pwd)
ROOT=${FITNESS:-$(cd "$HERE/../.." && pwd)}   # FITNESS: the checkout holding the gitignored sources
TAG=${1:-assets-$(date +%Y-%m-%d)}
OUT=$(mktemp -d)
trap 'rm -rf "$OUT"' EXIT
pack() { # name, dir, path...
  name=$1; dir=$2; shift 2
  tar -C "$dir" -cf - "$@" | zstd -q -T0 -10 | split -b 1900m - "$OUT/$name.tar.zst.part-"
}
pack food-images-raw "$HOME" food-images-raw            # → ~/food-images-raw
pack tts-work "$ROOT/app/.cache/tts" clean refs          # → app/.cache/tts/
pack food-data-raw "$ROOT/food-data" raw                 # → food-data/
(cd "$OUT" && shasum -a 256 *.part-* > SHA256SUMS)
gh release create "$TAG" -R "$REPO" --latest=false -t "$TAG" -F "$HERE/assets-release.md" "$OUT"/*
gh release list -R "$REPO" --limit 100 --json tagName --jq '.[].tagName' | grep '^assets-' | sort -r | tail -n +3 | while read -r old; do
  gh release delete "$old" -R "$REPO" --cleanup-tag -y
done
