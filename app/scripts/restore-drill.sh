#!/bin/sh
# Monthly restore drill: restore the latest snapshot to a temp dir and sanity-check it.
set -eu
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
restic restore latest --tag island --target "$TMP"
DB="$(find "$TMP" -name 'island-*.db' | sort | tail -1)"
[ -n "$DB" ] || { echo "no snapshot found"; exit 1; }
sqlite3 "$DB" "PRAGMA integrity_check;" | grep -qx ok
echo "restored: $DB"
sqlite3 "$DB" "SELECT 'ledger rows', count(*) FROM ledger_entry; SELECT 'jar yen', coalesce(sum(amount_yen),0) FROM ledger_entry WHERE bucket='jar'; SELECT 'last week locked', max(week_key) FROM week_lock WHERE locked_at IS NOT NULL;"
echo "restore drill ok"
