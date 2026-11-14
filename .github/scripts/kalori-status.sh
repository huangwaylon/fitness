#!/usr/bin/env bash
# status.json on the `kalori-status` branch (docs/food-data.md "Kalori": the status), which the app's bots tab reads.
#   kalori-status.sh get            the current status.json on stdout ({} when the branch has none yet)
#   kalori-status.sh <cmd> args...  food-data/scripts/kalori_status.py <cmd> on the current one (--prev), its --out
#                                   pushed as the branch's only commit: an orphan, force-pushed with a lease, so a write
#                                   that raced another (kalori-scrape.yml, kalori-watch.yml) is redone on the newer one
# Env: GH_REPO (owner/name); writing needs git's credentials for github.com (gh auth setup-git). KALORI_STATUS_REMOTE:
# another remote (a local bare repo, to try it).
set -euo pipefail
root=$(cd "$(dirname "$0")/../.." && pwd)
remote=${KALORI_STATUS_REMOTE:-https://github.com/$GH_REPO}
ref=refs/heads/kalori-status
d=$(mktemp -d); trap 'rm -rf "$d"' EXIT
git -C "$d" init -q

# $sha: the branch's commit ('' when it has none); $d/prev.json its status.json. ls-remote failing (the network, the
# token) stops here: never taken for a missing branch, which would drop the history.
current() {
  sha=$(git -C "$d" ls-remote "$remote" "$ref" | cut -f1)
  if [ -n "$sha" ]; then
    git -C "$d" fetch -q --depth=1 "$remote" "$ref"
    sha=$(git -C "$d" rev-parse FETCH_HEAD)
    git -C "$d" show FETCH_HEAD:status.json > "$d/prev.json" 2>/dev/null || echo '{}' > "$d/prev.json"
  else
    echo '{}' > "$d/prev.json"
  fi
}

if [ "${1:-}" = get ]; then current; cat "$d/prev.json"; exit 0; fi
for i in 1 2 3 4 5; do
  current
  python3 -I "$root/food-data/scripts/kalori_status.py" "$@" --prev "$d/prev.json" --out "$d/status.json"
  blob=$(git -C "$d" hash-object -w "$d/status.json")
  tree=$(printf '100644 blob %s\tstatus.json\n' "$blob" | git -C "$d" mktree)
  c=$(GIT_AUTHOR_NAME="github-actions[bot]" GIT_AUTHOR_EMAIL="41898282+github-actions[bot]@users.noreply.github.com" \
      GIT_COMMITTER_NAME="github-actions[bot]" GIT_COMMITTER_EMAIL="41898282+github-actions[bot]@users.noreply.github.com" \
      git -C "$d" commit-tree "$tree" -m "Kalori status: $1")
  if git -C "$d" push -q --force-with-lease="$ref:$sha" "$remote" "$c:$ref"; then
    echo "status.json: $1, verdict $(python3 -I -c 'import json,sys; print(json.load(open(sys.argv[1]))["verdict"])' "$d/status.json")"
    cp "$d/status.json" "${KALORI_STATUS_COPY:-/dev/null}"
    exit 0
  fi
  echo "status.json: the push raced another write, again ($i)"; sleep $((i * 3))
done
echo "::error::status.json was not written (5 tries)"; exit 1
