#!/usr/bin/env bash
# Download and decrypt one its-runner run's private log: the age-encrypted state dir (its_booking.log with fd 1/2 of
# the whole run, holds/reservations, debug dumps and the failure evidence: HTML and screenshots). Credential-bearing once
# decrypted (cookies, s= tokens, the applicant's form): it stays on this Mac, and goes when you are done.
#
#   its/runner/scripts/fetch-logs.sh <run-id>[-<attempt>] [out-dir]   # default out-dir: /tmp/its-logs-<run-id>[-<attempt>]
#
# <run-id>-<attempt> is the runner's run id as the Worker and the page show it (19283746-2); a bare run id takes its
# latest attempt. Needs `gh` (logged in), `age`, and the archive identity (ITS_AGE_KEY, default
# ~/.config/island-fund/archive-age.key, the secret half of ITS_LOG_RECIPIENT). Artifacts are kept 14 days.
set -euo pipefail

arg=${1:?usage: fetch-logs.sh <run-id>[-<attempt>] [out-dir]}
[[ $arg =~ ^([0-9]+)(-([0-9]+))?$ ]] || { echo "fetch-logs: a run id is a number, or number-attempt; got: $arg" >&2; exit 2; }
run=${BASH_REMATCH[1]}
attempt=${BASH_REMATCH[3]:-}
out=${2:-/tmp/its-logs-$arg}
key=${ITS_AGE_KEY:-$HOME/.config/island-fund/archive-age.key}
repo=${ITS_REPO:-huangwaylon/fitness}
[[ -r $key ]] || { echo "fetch-logs: no age identity at $key" >&2; exit 2; }

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
pattern="its-private-$run-${attempt:-*}"
gh run download "$run" -R "$repo" -p "$pattern" -D "$tmp"
# One artifact per attempt (its-private-<run>-<attempt>): the one asked for, else the latest.
f=$(find "$tmp" -name '*.age' | sort -V | tail -1)
[[ -n $f ]] || { echo "fetch-logs: run $arg uploaded no private log (preflight stop, or encryption failed)" >&2; exit 1; }

mkdir -p "$out"
chmod 700 "$out"
age -d -i "$key" "$f" | tar -xzf - -C "$out"
echo "$out:"
ls -la "$out"
echo
echo "Credential-bearing (cookies, s= tokens, the applicant's form). When done: rm -rf '$out'"
