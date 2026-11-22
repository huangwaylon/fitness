#!/bin/sh
# 行きたい場所's Mac-side puller (docs/ops/runbook.md#saved-places): launchd agents that run `record.ts places-pull` from
# this checkout, for when Google refuses the relay's own fetch (it stays the first try: a pull whose list the relay
# already read is skipped). Keys: ~/.config/island-fund/keys (scripts/admin.ts); logs: ~/Library/Logs/island-fund-places.log.
#   sh relay/scripts/places-launchd.sh install [--osm]   every 30 min the newest 50, 03:30 the whole list;
#                                                        --osm: daily 04:30 `places-osm 300` (hours of places due; idle once caught up)
#   sh relay/scripts/places-launchd.sh uninstall
#   sh relay/scripts/places-launchd.sh status            the agents and the log's last lines
# Install from the main checkout (the agents run the files where they are), never from a worktree.
set -eu
relay=$(cd "$(dirname "$0")/.." && pwd)
agents="$HOME/Library/LaunchAgents"
log="$HOME/Library/Logs/island-fund-places.log"
labels="com.island-fund.places-recent com.island-fund.places-full com.island-fund.places-osm"
domain="gui/$(id -u)"

plist() { # label, arguments (space-separated), schedule (plist XML)
  args=""
  for a in $2; do args="$args<string>$a</string>"; done
  cat > "$agents/$1.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$1</string>
  <key>ProgramArguments</key><array><string>$node</string><string>scripts/record.ts</string>$args</array>
  <key>WorkingDirectory</key><string>$relay</string>
  <key>EnvironmentVariables</key><dict><key>PATH</key><string>$(dirname "$node"):/usr/bin:/bin</string></dict>
  $3
  <key>StandardOutPath</key><string>$log</string>
  <key>StandardErrorPath</key><string>$log</string>
  <key>ProcessType</key><string>Background</string>
</dict></plist>
EOF
  launchctl bootout "$domain/$1" 2>/dev/null || true
  # (a bootout still finishing makes bootstrap fail with "5: Input/output error": once more after a moment)
  launchctl bootstrap "$domain" "$agents/$1.plist" 2>/dev/null || { sleep 2; launchctl bootstrap "$domain" "$agents/$1.plist"; }
  echo "installed $1"
}

case "${1:-}" in
  install)
    node=$(command -v node) || { echo "places-launchd: no node on PATH" >&2; exit 1; }
    [ -f "$HOME/.config/island-fund/keys" ] || { echo "places-launchd: no ~/.config/island-fund/keys" >&2; exit 1; }
    mkdir -p "$agents" "$(dirname "$log")"
    plist com.island-fund.places-recent "places-pull --recent" '<key>StartInterval</key><integer>1800</integer>'
    plist com.island-fund.places-full "places-pull" '<key>StartCalendarInterval</key><dict><key>Hour</key><integer>3</integer><key>Minute</key><integer>30</integer></dict>'
    if [ "${2:-}" = "--osm" ]; then
      plist com.island-fund.places-osm "places-osm 300" '<key>StartCalendarInterval</key><dict><key>Hour</key><integer>4</integer><key>Minute</key><integer>30</integer></dict>'
    fi
    ;;
  uninstall)
    for l in $labels; do
      launchctl bootout "$domain/$l" 2>/dev/null || true
      rm -f "$agents/$l.plist"
    done
    echo "uninstalled (the log stays: $log)"
    ;;
  status)
    for l in $labels; do
      if launchctl print "$domain/$l" >/dev/null 2>&1; then
        echo "$l: $(launchctl print "$domain/$l" | awk '/last exit code/ {print "last exit " $NF; exit}')"
      else
        echo "$l: not installed"
      fi
    done
    [ -f "$log" ] && tail -n 5 "$log"
    ;;
  *) echo "usage: sh relay/scripts/places-launchd.sh install [--osm] | uninstall | status" >&2; exit 2 ;;
esac
