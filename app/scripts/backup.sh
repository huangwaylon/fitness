#!/bin/sh
# Nightly backup: consistent SQLite snapshot → restic (client-side encrypted) → off-Kantō bucket.
# Needs: sqlite3, restic, and RESTIC_REPOSITORY / RESTIC_PASSWORD_FILE (+ bucket credentials) in the environment.
set -eu
DATA_DIR="${DATA_DIR:-$(cd "$(dirname "$0")/.." && pwd)/data}"
SNAP_DIR="${SNAP_DIR:-$HOME/island-backups}"
mkdir -p "$SNAP_DIR"
SNAP="$SNAP_DIR/island-$(date +%Y%m%d).db"
sqlite3 "$DATA_DIR/island.db" ".backup '$SNAP'"
sqlite3 "$SNAP" "PRAGMA integrity_check;" | grep -qx ok
restic backup --tag island "$SNAP"
restic forget --tag island --keep-daily 14 --keep-weekly 8 --keep-monthly 24 --prune
find "$SNAP_DIR" -name 'island-*.db' -mtime +7 -delete
echo "backup ok: $SNAP"
