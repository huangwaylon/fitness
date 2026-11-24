#!/usr/bin/env bash
# The ops inbox (docs/ops/runbook.md §0): one open issue per area, titled "Ops: <area>: <why>", never a red run's mail
# (a run its-bot dispatches has the App as its actor, and GitHub mails no one for it).
#   ops-issue.sh <label> <area> [--twice]
# Env: WHY (the reasons, codes and counts only: the repo is public; empty = healthy), COUNTS (the numbers; may be
# Markdown lines), LOOK (where to investigate), GH_TOKEN (issues: write), GH_REPO. A reason opens the area's issue, a
# change of reasons (not of their numbers) comments on it and retitles it, healthy closes it. --twice: a new issue only when this
# workflow's previous finished run failed too (actions: read): a half-hourly job's one-off blip opens nothing.
set -euo pipefail
label=$1 area=$2 twice=${3:-}
why=${WHY:-} counts=${COUNTS:-}
run="$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID"
open=$(gh issue list --label "$label" --state open --json number,title \
  --jq "[.[] | select(.title | startswith(\"Ops: $area:\"))][0].number // empty")
if [ -z "$why" ]; then
  [ -z "$open" ] || gh issue close "$open" --comment "Healthy again: $counts"
  exit 0
fi
echo "::warning::$area: $why"
body="$why

$counts

Investigate: ${LOOK:-docs/ops/runbook.md §0}. Run: $run"
if [ -n "$open" ]; then
  last=$(gh issue view "$open" --json comments,body --jq '(.comments | last | .body) // .body' | head -1)
  # (the numbers drift run to run: only a change of reasons comments, and retitles: the Jobs page shows the title)
  [ "$(echo "$last" | tr -d '0-9')" = "$(echo "$why" | tr -d '0-9')" ] && exit 0
  gh issue comment "$open" --body "$body"
  t="Ops: $area: $why"
  gh issue edit "$open" --title "${t:0:120}" || true
  exit 0
fi
if [ "$twice" = --twice ]; then
  wf=${GITHUB_WORKFLOW_REF%@*}; wf=${wf##*/}
  prev=$(gh run list -w "$wf" -L 10 --json databaseId,status,conclusion \
    --jq "[.[] | select(.databaseId != $GITHUB_RUN_ID and .status == \"completed\" and .conclusion != \"cancelled\" and .conclusion != \"skipped\")][0].conclusion // empty") || prev=
  [ "$prev" = failure ] || { echo "the first failure in a row: no issue yet"; exit 0; }
fi
gh label create "$label" --color B60205 --description "an ops alert (docs/ops/runbook.md §0)" 2>/dev/null || true
t="Ops: $area: $why"
gh issue create --label "$label" --title "${t:0:120}" --body "$body"
