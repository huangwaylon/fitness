# Runbook

The relay (`relay/`, a Worker on the Free plan: deploy §8, the record §9, the log §11) and the app (a static PWA on
Cloudflare Pages, https://island-fund.pages.dev/). How it works: [backend.md](../backend.md). Code cites these
sections by number: renumber them together.

## 0. Scheduled work
Alerts: one issue per area, `Ops: <area>: <why>` (`.github/scripts/ops-issue.sh`), closed when healthy. its-bot
dispatches the workflows (`dispatch.ts`); schedules are the backstop. Every cron must be here; [brackets]: its name in
ボット → Jobs ([bots.md](../bots.md) "Jobs").

| Job | Cron (UTC) | Fired by (JST) | Does | Alert → label |
|---|---|---|---|---|
| relay tick [Server timer] | `15,45 * * * *` | Cloudflare | weather, wet days, place categories, catch-up | `relay_cron_stale` → `alert` |
| relay nightly [Nightly cleanup, Backup] | `0 18 * * *` | Cloudflare, 03:00 | `relay/src/nightly.ts`; the backup (§6) | `nightlyH`, `backupH` > 30 h → `alert` |
| its-bot [Job trigger] | `*/5 * * * *` | Cloudflare | ITS watchdog; dispatches | `dispatch_stopped` → `alert`; `dispatch_failed` → `its-alert` |
| gym-bot | `7 * * * *` | Cloudflare | re-arms its alarm | `verdict_*`, `checks_stale` → `gym-alert` |
| health.yml [Server check] | `17 * * * *` | its-bot :15/:45 | §2; gym-bot's /status | `relay_down`, `site_down`, `log_down`, the log's → `alert` |
| its-health.yml [ITS bot check] | `23,53 * * * *` | its-bot :15/:45 | /health/its | `its-alert` |
| its-runner.yml | `7,37 * * * *` | schedule; 開始, the watchdog | the booker | its-health's |
| places-pull.yml [Google Maps sync] | `23,53 * * * *` | its-bot :15/:45 | §9 the list | failed twice → `places-alert`; `placesH` ≥ 3 → `alert` |
| places-details.yml [Place hours] | `41 19 * * *` | its-bot 03:30 | the details | failed, none in 48 h → `places-alert` |
| e2e-flake-hunt.yml [Flaky-test hunt] | `30 19 * * *` | its-bot 04:30 | testing.md "CI" | failures, `hunt_broken` → `flake` |
| kalori-scrape.yml [Chain menus] | `41 17 * * 2` | Wed 02:41; its-bot if missed | §13 | status.json |
| kalori-watch.yml | `29 */6 * * *` | schedule only | §13: late, stuck, the deploy | → `kalori-alert` |
| Deploy UI [Site deploy], e2e logic full [Full test run], Relay checks [Relay deploy] | — | a push | testing.md, §8 | the red run, mailed |
| restore drill | — | by hand, monthly | §6 | — |

## 1. Deploy the UI
A push touching `app/**` runs *Deploy UI* (`pages.yml`, [testing.md](testing.md#ci-githubworkflowspagesyml)) with
repo secrets `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` (*Cloudflare Pages → Edit*). By hand from `app/`: `npm run
build`, `npx wrangler pages deploy build-pages --project-name island-fund --branch main`. `404.html` is `index.html` on
purpose (the stale-chunk reload needs a real 404). Not served: re-run the job. Before a model change: `npm run bench`.

## 2. Check the backend
```sh
curl -sS https://island-fund-relay.island-fund-relay.workers.dev/health                     # the Worker and the room
curl -sS https://island-fund-relay.island-fund-relay.workers.dev/api --data '{"action":"health"}'   # the record
```
Both `{"ok":true,…}` (`health.yml` runs them). Red: one down, `dispatch_stopped` (its-bot's cron or App token,
its/README.md "GitHub App"), `relay_cron_stale` (`cronAt` > 2 h). Test: `gh workflow run health.yml -f
simulate=relay_down`. `/health`'s `wx` stale (`age` > ~35 min or `hours` < 30): `npm run logs -- --event cron.wx
--since 2d`, admin op `{"op":"wx","refresh":true}` (`relay/scripts/admin.ts`). Rows vs the plan: `npm run logs -- stats`.

## 3. Rotate a key
`openssl rand -hex 32` into the password manager; `npx wrangler secret put KEY_A` (or `KEY_B`) from `relay/`, `gym/`
and `its/worker/` (the old key fails at once); the person pastes it on the pairing screen and in their Shortcut's
**Key**; update the keys file (`~/.config/island-fund/keys`; `/admin` signs with `KEY_A:KEY_B`), `relay/.smoke-keys`
(`npx wrangler secret bulk .smoke-keys --env test`) and the secrets bundle (§6).

**`KEY_C`** (guest, relay only): `secret put` / `secret delete KEY_C` ends guest access. **`PLACES_KEY`** (§9): `npx
wrangler secret put PLACES_KEY` (and `--env test`), `gh secret set RELAY_PLACES_KEY`, a `PLACES_KEY=` line in the keys
file; delete it to turn the places path off.

## 4. A new epoch (rev)
`rev` (`e1`, `e2`, …) changes on a restore (§9) or `node scripts/record.ts rev`; every phone then refetches all rows.

## 5. When sync fails
「まだ設定されていません」: the build lacked `VITE_LIVE_URL` / `VITE_RECORD_URL`. Unreachable: §2, `npx wrangler tail`.
`unauthorized`: re-paste the key. `busy`: > 120 requests/minute (retried). `too_large`: > 1 MB, send a baseline in
chunks. Health numbers didn't move: the `uploads` audit ([shortcut §6](shortcut-health-sync.md#6-troubleshooting)):
```sh
curl -sS https://island-fund-relay.island-fund-relay.workers.dev/api --data "{\"key\":\"$KEY\",\"action\":\"uploads\"}"
```

## 6. Backups
The record is the only copy of buys and settings (health can be re-sent: [shortcut §5](shortcut-health-sync.md#5-one-time-baseline-optional)).
PITR keeps 30 days.

- **The daily dump** (`relay/src/archive.ts`, 03:00): gzipped, age-encrypted to `ARCHIVE_RECIPIENT`, in release `dumps`
  of `huangwaylon/fitness-archive` (test `dumps-test`), 90 kept, logged `cron.backup`; with it the bots' state
  (its-bot `/its/status`, gym-bot `/gym/state` via `ITS_BOT`, `GYM_BOT`). Token: the GitHub App's
  ([its/README](../../its/README.md#github-app)); without it `no_token`. By hand: `node scripts/record.ts backup
  [--test]`; check `verify-dump [date]`; read: `gh release download dumps -R huangwaylon/fitness-archive -p <name>`,
  then `record.ts load` or `age -d -i ~/.config/island-fund/archive-age.key <name> | gunzip`.

**Restore:** a bookmark from before the bad change (§9), or `load <file>` into an empty record, then `rev`; re-check
each trip's 共有リンク (a restore revives links turned off since). **A bot:** from its decrypted file (`rm` it after),
its README's "Operations".

**The restore drill** (monthly, this Mac, ~3 min; the decrypted record never leaves it): in `mkdir -m 700
/tmp/restore-drill` put throwaway `KEY_A=`/`KEY_B=`/`KEY_C=` in `keys` and the newest record, `its-`, `gym-` files;
from `relay/` run `npx wrangler dev --local --persist-to /tmp/restore-drill/state --port 8790 --ip 127.0.0.1
--env-file /tmp/restore-drill/keys`; with `env -u KEY_A -u KEY_B -u KEY_C RELAY_ORIGIN=http://127.0.0.1:8790
KEYS_FILE=/tmp/restore-drill/keys` `load` it, then compare `counts` (`events` ~1 % fewer), `wallet`, `shopcheck`,
`decorcheck` with live. Bots: `wrangler dev --local --var MODE:off` in `its/worker/` (8799) and `gym/` (8798) with
`KEY_A`, `ITS_RUNNER_TOKEN`, `GYM_TOKEN`; restore, read back equal. Then stop all, `rm -rf /tmp/restore-drill`.

**The secrets bundle:** `~/.config/island-fund/secrets-bundle.age` (600) holds every Worker and Actions secret this Mac
has, encrypted to `archive-age.pub`; remake after a rotation (`sh relay/scripts/secrets-bundle.sh`). Not in it
(reissue): `HEALTH_TOKEN` ([observability](observability.md#the-alert)), `CLOUDFLARE_API_TOKEN`, `ITS_IMAP_USER` /
`ITS_IMAP_APP_PASSWORD` (a Gmail app password), `ITS_ADDR` … `ITS_ZOKUGARA`.

## 7. Refresh the official art
From `app/` (needs `cwebp`): `npm run assets:fetch` (`SPECS` in `app/scripts/fetch-assets.ts`), `npm run
catalog:build`, `NH_MODELS=<models dir> npm run icons:nh`, `npm run models` (`JOBS` in `app/scripts/models.ts`, Chrome).
Never commit the model folder.

## 8. Deploy the live relay
**Automatic:** a push touching the relay (`relay.yml`'s paths ⊇ `relay-first.ts RELAY_PATHS`, `relay/test/paths.test.ts`)
runs *Relay checks*: `test` (step 1), then `deploy` (environment `relay`, newest pending wins): steps 2–3 unless live
already has the last relay commit. Secrets: `CLOUDFLARE_*` (§1, plus *Workers Scripts → Edit*), `RELAY_TEST_SMOKE_KEYS`
(`relay/.smoke-keys`; without it the smoke is skipped). **Redeploy:** *Run workflow*. **By hand** from `relay/`:
1. `npm ci`, `npm run check`, `npm run knip`, `npm test`.
2. `npm run deploy:test`, `npm run smoke` (every line `ok`).
3. `npm run deploy` (`scripts/deploy.sh` refuses uncommitted changes or a commit not on `origin/main`: migrations are
   account-wide). Then §2.

**Is live main's?** After `git fetch`:
```sh
sha=$(curl -s https://island-fund-relay.island-fund-relay.workers.dev/health | jq -r .sha)
git merge-base --is-ancestor "$(git log -1 --format=%h origin/main -- relay app/src/lib/contract)" "$sha" && echo current || echo behind
```
*Deploy UI* runs it (`app/scripts/relay-first.ts`), waits 15 min, then fails `Relay behind`: fix *Relay checks*,
re-run. Never `wrangler delete`. **Roll back:** `npx wrangler rollback <version-id>` (migrations can't); the app: `git
revert` + push (`scripts/deploy-order.ts` refuses older runs) or Pages' *Rollback*.

## 9. The record
From `relay/`: `node scripts/record.ts <command>` with the keys file (§3; or `KEY_A=… KEY_B=…`, never on a shared
command line; `--test`; `RELAY_ORIGIN` + `KEYS_FILE` for a local relay). It signs `POST /admin`; its header lists
every command.

| Command | Does |
|---|---|
| `counts`, `rev` | rows per table, `rev`, newest `at`, `schema_v`; a new epoch (§4) |
| `bookmark [ms]`, `restore <bookmark>` | PITR, 30 days (`rev` only if the reply's `note` asks) |
| `dump > file.json`, `load <file>`, `backup`, `verify-dump` | never in the repo; `load` into an empty record (§6) |
| `shopcheck [fix]`, `decorcheck [fix]` | running counts vs a full fold; `fix` takes the fold's |
| `adjust <A\|B\|G> <v> <note>` | a かいがら correction, only when asked ([backend](../backend.md#shop-adjust)) |
| `ledger [who]`, `wallet`, `ledgercheck`, `walletset <A\|B\|G> <h> <note>`, `ledger-retire [dry]` | [the ledger](../backend.md#the-ledger); `walletset` only when asked, backup first; `ledger-retire` once, dump and `dry` first |
| `tomb-prune [dry]`, `island-prune [dry]` | the 03:00 prunes now |
| `todo-migrate [dry]` | the one-off fold of やること's lists ([todo](../todo.md#the-move-from-lists)); rerun after `load`ing a dump from before 2026-11-25 |
| `img-set <A\|B\|G> <id> <file> [--ig] [--dry-run]`, `inbody <A\|B> <date> <muscle_kg> <smm_kg>` | a custom food's picture (384 px, stripped); an InBody sheet |
| `held [A\|B]`, `promote <person> <date> <metric> [value]` | held-back zeros; promote one |

<a id="saved-places"></a>**Saved places** ([backend](../backend.md#saved-places)): `places-pull.yml` runs
`places-pull [--recent] [--force]` (signed with `RELAY_PLACES_KEY`); `places-ids` / `places-details <file>` feed
`places-details.yml` (docs/places.md "Details"); `places` runs a tick. Parsing broke (`cron.places` error): the last
good list serves; fix `itemOf`/`parseList`. Healthy: `/places/status` `syncedAt` < 35 min.

## 10. Pair a phone
Safari → https://island-fund.pages.dev/ → Share → **Add to Home Screen** *first*, then paste the key in the installed
app (it has its own storage). Then the Shortcut: [shortcut-health-sync.md](shortcut-health-sync.md) §2–4.

### The guest
The same with `KEY_C` (§3), no Shortcut. Send them:

> 1. iPhone の Safari で https://island-fund.pages.dev/ を ひらいて、きょうゆう → **ホーム画面に追加**。
> 2. ホーム画面の しまの貯金箱 を ひらいて、この キーを はりつけて **接続**：`<KEY_C>`
> 3. 設定 → 姿 で すきな すがたと なまえを えらんでね。

## 11. The log
[observability.md](observability.md): `npm run logs`, the checklist, the alert, `LOG_OFF`.

## 12. The bots
[gym/README.md](../../gym/README.md) "Operations"; [its/README.md](../../its/README.md) "Operations",
"Investigating" (Gmail is the ground truth); Chain menus §13.

## 13. Refresh Kalori
How it works: [food-data "Kalori"](../food-data.md#kalori). One run at a time; its-bot dispatches a missed week. Pause:
`gh workflow disable` both kalori workflows (cancel a queued retry too). The `KALORI_TAG` release must be published.

1. **A held update** (PR `kalori-update/<tag>`, no CI): check the counts (~54k items), merge by hand; reject: close it,
   `gh release delete <tag> --cleanup-tag`.
2. **Undo an automatic merge:** `git revert` "Kalori: <tag> (auto)", push, `gh workflow run pages.yml --ref main`, then
   `GH_REPO=huangwaylon/fitness .github/scripts/kalori-status.sh undo --tag <tag> --fetch-py
   food-data/scripts/fetch.py --kalori app/static/food/kalori.json`.
3. **By hand:** `gh workflow run kalori-scrape.yml` (`refetch_before`; `-f wip_tag=kalori-wip-<name>` never
   publishes). **Locally:** bump `KALORI_TAG` in `food-data/scripts/fetch.py`; `python3 -I food-data/scripts/fetch.py
   kalori`; `python3 -I food-data/scripts/build.py kalori`; `cd app && npm run food:data && npm run verify`; commit.

**Alerts** (`status.json` on branch `kalori-status`; `kalori-alert`):

| Status | Do |
|---|---|
| `drift`, `nonut` | fix fixtures (`food-data/scripts/tests/fixtures/`) and parsers, bump `PARSER_VERSION` (`RECORDS_FROM` if records change), dispatch |
| `limits`, `incomplete` | dispatch (recurring: lower `total_rate`) |
| `diff_gate` (> 15 % changed or 5 % gone) | if right, dispatch with `allow_big_diff` |
| `band_*`, `tests`, `main_moved` | held (1); `main_moved`: redo locally (3) |
| `crash`, `publish`, `update`, `reverted` | the job's log, fix, dispatch or (3) |
| `deploy_failed` | `gh run rerun <id>` or undo (2) |
| `late` (none in 8 days), `stuck` (a run > 2 days, or `running` 8 h with no run) | `gh run cancel <id>` if stuck; dispatch |
