#!/bin/sh
# The coordinator's project notes (Claude Code's memory for this repo, outside it), by hand after they change:
# an age-encrypted tar as this repo's `notes` release asset, the last 26 kept. Needs age and gh.
# Restore: gh release download notes -p 'notes-YYYY-MM-DD.tar.age' &&
#   age -d -i ~/.config/island-fund/archive-age.key notes-YYYY-MM-DD.tar.age | tar -xf - -C "$NOTES"
set -eu
export GH_HOST=github.com
REPO=huangwaylon/fitness
NOTES=${NOTES:-$HOME/.claude/projects/-Users-waylonhuang-Documents-other-fitness/memory}
PUB=$HOME/.config/island-fund/archive-age.pub
KEEP=26
OUT=$(mktemp -d)
trap 'rm -rf "$OUT"' EXIT
f=notes-$(date +%Y-%m-%d).tar.age
tar -C "$NOTES" -cf - . | age -R "$PUB" -o "$OUT/$f"
gh release view notes -R "$REPO" >/dev/null 2>&1 || gh release create notes -R "$REPO" --latest=false -t notes -n "Encrypted project notes (app/scripts/notes-backup.sh)." >/dev/null
gh release upload notes -R "$REPO" --clobber "$OUT/$f"
gh release view notes -R "$REPO" --json assets --jq '.assets[].name' | grep '^notes-.*\.age$' | sort |
  awk -v k="$KEEP" '{a[NR]=$0} END{for(i=1;i<=NR-k;i++)print a[i]}' | while read -r old; do
  gh release delete-asset notes "$old" -R "$REPO" -y
done
echo "ok $f"
