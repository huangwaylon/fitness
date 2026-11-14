#!/usr/bin/env bash
# The deploy of an automatic Kalori merge (docs/food-data.md "Kalori": the deploy check): the Deploy UI and Food data
# checks runs that kalori-scrape.yml's status job dispatched after merge.sha (main's tip then: it or a later commit
# holding it), found by the API (a run the workflow token started fires no workflow_run), their outcome in
# status.json. The decision: kalori_status.py decide. Both modes are idempotent (decide's comment).
#   kalori-deploy.sh check SHA SINCE   kalori-scrape.yml's deploy-check: polls every 30 s, 70 min (again after a re-run)
#   kalori-deploy.sh backstop          kalori-watch.yml: one look at a merge still pending 160 min after status.json's write
# Food data checks failed: Deploy UI's unfinished runs of it cancelled, the commit reverted on main (only the bot's
# "(auto)" one; once), pages.yml dispatched (reverted). Deploy UI failed: its failed jobs re-run once (refused, and not
# begun elsewhere: deploy_failed at once), then deploy_failed. Both green: ok. A run not seen: failed.
# Env: GH_REPO, GH_TOKEN, git's credentials (gh auth setup-git); KALORI_DEPLOY_POLL (s); KALORI_NOW (ms),
# KALORI_STATUS_REMOTE: the tests.
set -euo pipefail
root=$(cd "$(dirname "$0")/../.." && pwd)
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
run_url=${GITHUB_RUN_ID:+${GITHUB_SERVER_URL:-https://github.com}/$GH_REPO/actions/runs/$GITHUB_RUN_ID}
bot='github-actions[bot]'
botmail='41898282+github-actions[bot]@users.noreply.github.com'

# $tmp/runs.json: main's dispatched runs since $since (less 2 min; one call for both workflows: the token's hourly
# quota); $also: their heads, other than $sha, that hold it (main fetched for a head not known yet).
runs() {
  local from h fetched=''
  from=$(jq -rn --arg t "$since" '($t | fromdateiso8601) - 120 | todate')
  gh api "repos/$GH_REPO/actions/runs?branch=main&event=workflow_dispatch&created=%3E%3D$from&per_page=100" \
    --jq .workflow_runs > "$tmp/runs.json" || return 1
  also=''
  for h in $(jq -r --arg s "$sha" '[.[].head_sha | select(. != $s)] | unique | .[]' "$tmp/runs.json"); do
    if ! git -C "$root" cat-file -e "$h^{commit}" 2>/dev/null && [ -z "$fetched" ]; then
      git -C "$root" fetch -q origin main || true; fetched=1
    fi
    ! git -C "$root" merge-base --is-ancestor "$sha" "$h" 2>/dev/null || also="$also,$h"
  done
}

# $tmp/d.json: decide's next step (check: --sha, --since, --reran; backstop: status.json's merge).
decide() {
  runs || return 1
  local args=(--sha "$sha" --since "$since" --reran "$reran")
  [ "$mode" = check ] || args=(--prev "$tmp/status.json")
  python3 -I "$root/food-data/scripts/kalori_status.py" decide --runs "$tmp/runs.json" "${args[@]}" --also "$also" \
    ${KALORI_NOW:+--now "$KALORI_NOW"} > "$tmp/d.json"
}

# Deploy UI's unfinished runs of the bad merge (a re-run's attempt too) cancelled: none may publish it after the revert.
cancel() {
  local id
  for id in $(jq -r '.cancel // [] | .[]' "$tmp/d.json"); do
    gh run cancel "$id" || echo "::warning::the cancel of Deploy UI run $id failed (ended meanwhile?)"
  done
}

status() { "$root/.github/scripts/kalori-status.sh" deploy "$@"; }

# The Kalori commit reverted on main's tip (a lost push race: fetched and done again). 0: reverted (now or before),
# 2: not the bot's "(auto)" commit, left alone. $tmp/fetch.py and $tmp/kalori.json: main's after it. (Called under
# ||, so no errexit here: each step checked.)
revert() {
  local sha=$1 tip='' i
  for i in 1 2 3 4 5; do
    git -C "$root" fetch -q origin main || return 1
    git -C "$root" merge-base --is-ancestor "$sha" FETCH_HEAD || { echo "::error::$sha is not on main"; return 1; }
    if git -C "$root" log --format=%H --grep "This reverts commit $sha" "$sha..FETCH_HEAD" | grep -q .; then
      echo "already reverted on main"; tip=$(git -C "$root" rev-parse FETCH_HEAD); break
    fi
    local who; who=$(git -C "$root" log -1 --format='%an|%s' "$sha") || return 1
    [[ "$who" =~ ^github-actions\[bot\]\|Kalori:\ kalori-[0-9]{4}-[0-9]{2}-[0-9]{2}(-[0-9]+)?\ \(auto\)$ ]] || {
      echo "::warning::$sha is not the bot's automatic merge ($who): not reverted"; return 2; }
    git -C "$root" checkout -q --detach FETCH_HEAD || return 1
    git -C "$root" -c user.name="$bot" -c user.email="$botmail" revert --no-edit "$sha" || return 1
    if git -C "$root" push -q origin HEAD:refs/heads/main; then tip=$(git -C "$root" rev-parse HEAD); break; fi
    sleep $((i * 5))
  done
  [ -n "$tip" ] || { echo "::error::the revert did not push"; return 1; }
  git -C "$root" show "$tip:food-data/scripts/fetch.py" > "$tmp/fetch.py" || return 1
  git -C "$root" show "$tip:app/static/food/kalori.json" > "$tmp/kalori.json" || return 1
}

# Acts on decide's $tmp/d.json; $action: its action.
act() {
  local why url id sha rc=0
  action=$(jq -r .action "$tmp/d.json"); why=$(jq -r .why "$tmp/d.json"); id=$(jq -r '.id // empty' "$tmp/d.json")
  url=$(jq -r '.url // empty' "$tmp/d.json"); sha=$(jq -r .sha "$tmp/d.json"); url=${url:-$run_url}
  echo "$action: $why${url:+ ($url)}"
  case "$action" in
    ok) status --sha "$sha" --deploy ok --run-url "$url" ;;
    failed) status --sha "$sha" --deploy failed --reason deploy_failed --alert-text "$why ($url)" --run-url "$url" ;;
    rerun)
      if ! gh run rerun "$id" --failed; then
        if [ "$(gh api "repos/$GH_REPO/actions/runs/$id" --jq .run_attempt || echo 1)" -gt 1 ]; then echo "re-run begun elsewhere"
        else
          status --sha "$sha" --deploy failed --reason deploy_failed --run-url "$url" \
            --alert-text "Deploy UI failed and its re-run was refused ($url)"
          action=failed
        fi
      fi ;;
    revert)
      cancel
      revert "$sha" || rc=$?
      if [ "$rc" = 2 ]; then
        status --sha "$sha" --deploy failed --reason deploy_failed --run-url "$url" \
          --alert-text "$why, but $sha is not the bot's automatic merge: not reverted ($url)"
      elif [ "$rc" = 0 ]; then
        if decide; then cancel; fi   # (one begun meanwhile)
        gh workflow run pages.yml --ref main
        status --sha "$sha" --deploy reverted --reason reverted --fetch-py "$tmp/fetch.py" --kalori "$tmp/kalori.json" \
          --alert-text "$why: reverted ($url)" --run-url "$url"
      else return 1; fi ;;
  esac
}

mode=${1:-} sha='' since='' reran='' also=''
main() {
  case "$mode" in
    check)
      sha=$2 since=$3
      local poll=${KALORI_DEPLOY_POLL:-30} deadline
      deadline=$(($(date +%s) + 70 * 60))
      while :; do
        if decide; then
          act
          case "$action" in
            ok|failed|revert) return 0 ;;
            rerun) reran=$(jq -r .id "$tmp/d.json"); deadline=$(($(date +%s) + 70 * 60)) ;;
          esac
        else echo "::warning::the runs' lookup failed: again in ${poll}s"; fi
        if [ "$(date +%s)" -ge "$deadline" ]; then
          echo "::warning::not finished in 70 min: merge.deploy stays pending, for the watch's backstop"; return 0
        fi
        sleep "$poll"
      done ;;
    backstop)
      "$root/.github/scripts/kalori-status.sh" get > "$tmp/status.json"
      sha=$(jq -r 'select(.merge.deploy == "pending" and .run.endedAt) | .merge.sha // empty' "$tmp/status.json")
      [ -n "$sha" ] || { echo "no merge pending"; return 0; }
      since=$(jq -r '.run.endedAt / 1000 | floor | todate' "$tmp/status.json")
      decide
      act ;;
    *) echo "usage: kalori-deploy.sh check SHA SINCE | backstop"; return 2 ;;
  esac
}

# (one line: bash has read all of it before a revert's checkout can change this file)
main "$@"; exit $?
