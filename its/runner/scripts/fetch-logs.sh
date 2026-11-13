#!/usr/bin/env bash
# Download and decrypt one its-runner run's private log: the age-encrypted state dir (its_booking.log with fd 1/2 of
# the whole run, holds/reservations, debug dumps). Credential-bearing once decrypted: it stays on this Mac.
#
#   its/runner/scripts/fetch-logs.sh <run-id> [out-dir]      # default out-dir: /tmp/its-logs-<run-id>
#
# Needs `gh` (logged in), `age`, and the archive identity (ITS_AGE_KEY, default ~/.config/island-fund/archive-age.key,
# the secret half of ITS_LOG_RECIPIENT). Artifacts are kept 3 days.
set -euo pipefail

run=${1:?usage: fetch-logs.sh <run-id> [out-dir]}
[[ $run =~ ^[0-9]+$ ]] || { echo "fetch-logs: a run id is a number, got: $run" >&2; exit 2; }
out=${2:-/tmp/its-logs-$run}
key=${ITS_AGE_KEY:-$HOME/.config/island-fund/archive-age.key}
repo=${ITS_REPO:-huangwaylon/fitness}
[[ -r $key ]] || { echo "fetch-logs: no age identity at $key" >&2; exit 2; }

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
gh run download "$run" -R "$repo" -p 'its-private-*' -D "$tmp"
# One artifact per attempt (its-private-<run>-<attempt>): the latest attempt's.
f=$(find "$tmp" -name '*.age' | sort -V | tail -1)
[[ -n $f ]] || { echo "fetch-logs: run $run uploaded no private log (preflight stop, or encryption failed)" >&2; exit 1; }

mkdir -p "$out"
chmod 700 "$out"
age -d -i "$key" "$f" | tar -xzf - -C "$out"
echo "$out:"
ls -la "$out"
