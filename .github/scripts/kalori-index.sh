#!/usr/bin/env bash
# kalori-index.sh <food dir> <index.json>: exit 0 when <index.json> is <food dir>/index.json with `files` and `version`
# recomputed as app/scripts/food-data.ts's writeIndex does over the dir's files (the new kalori.json in it), and
# nothing else changed but kalori.json's entry (kept as food-data.ts's KALORI). kalori-scrape.yml's update-merge checks
# update-build's index.json with it; food-data/scripts/tests/test_kalori_status.py runs it on the committed one.
set -euo pipefail
dir=$1; new=$2
files=$(jq -r '.datasets[].file' "$new")
for x in $files; do [[ "$x" =~ ^[a-z0-9_-]+\.json$ ]] || { echo "kalori-index: odd file $x" >&2; exit 1; }; done
h12() { if command -v sha256sum > /dev/null; then sha256sum | cut -c1-12; else shasum -a 256 | cut -c1-12; fi; }
own=$(for x in verify.json $files; do printf '%s %s\n' "$x" "$(h12 < "$dir/$x")"; done | jq -Rn '[inputs | split(" ") | {(.[0]): .[1]}] | add')
version=$( (cd "$dir" && for x in verify.json $files; do printf '%s\0' "$x"; cat "$x"; printf '\0'; done) | h12)
jq -e --slurpfile old "$dir/index.json" --argjson own "$own" --arg v "$version" '
  def rest: del(.files, .version) | .datasets |= map(select(.file != "kalori.json"));
  rest == ($old[0] | rest) and .files == $own and .version == $v and
  any(.datasets[]; . == {file: "kalori.json", source: "kalori", badge: "店", secondary: true, lazy: true})' "$new" > /dev/null \
  || { echo "kalori-index: $new is not $dir/index.json with the new kalori.json" >&2; exit 1; }
