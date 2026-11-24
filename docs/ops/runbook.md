# Runbook

The relay (`relay/`, a Cloudflare Worker on the Free plan, §8: the record §9, the room, the log §11) and the app (a
static PWA on Cloudflare Pages, https://island-fund.pages.dev/). How it works: [backend.md](../backend.md). Code cites
these sections by number: renumber them together.

## 0. Scheduled work
Alerts: one issue per area, `Ops: <area>: <why>` (`.github/scripts/ops-issue.sh`), closed when healthy.
its-bot dispatches the workflows (`its/worker/src/dispatch.ts`); schedules are the backstop. Every cron must be here.

| Job | Cron (UTC) | Fired by (JST) | Does | Alert → label |
|---|---|---|---|---|
| relay tick | `15,45 * * * *` | Cloudflare | weather, wet days, places' categories, alarm check, nightly catch-up | `relay_cron_stale` → `alert` |
| relay nightly | `0 18 * * *` | Cloudflare, 03:00 | `relay/src/nightly.ts`; the backup (§6) | `nightlyH`, `backupH` > 30 h → `alert` |
| its-bot | `*/5 * * * *` | Cloudflare | the ITS watchdog; the dispatches below | `dispatch_stopped` → `alert`; `dispatch_failed` → `its-alert` |
| gym-bot | `7 * * * *` | Cloudflare | re-arms its checks' alarm if lost | `verdict_broken`/`_failing`, `checks_stale` → `gym-alert` |
| health.yml | `17 * * * *` | its-bot :15/:45 | §2; gym-bot's /status | `relay_down`, `site_down`, `log_down`, the log's → `alert` |
| its-health.yml | `23,53 * * * *` | its-bot :15/:45 (15 min while booking) | /health/its | → `its-alert` |
| its-runner.yml | `7,37 * * * *` | schedule; 開始, the watchdog | the booker | its-health's |
| places-pull.yml | `23,53 * * * *` | its-bot :15/:45 | §9 the list | failed twice → `places-alert`; `placesH` ≥ 3 → `alert` |
| places-details.yml | `41 19 * * *` | its-bot 03:30 | the details | failed, refused, none in 48 h → `places-alert` |
| e2e-flake-hunt.yml | `30 19 * * *` | its-bot 04:30 | testing.md "CI" | failures, `hunt_broken` → `flake` |
| kalori-scrape.yml | `41 17 * * 2` | Wed 02:41; its-bot if missed | §13 | status.json (定期処理's メニューの更新) |
| kalori-watch.yml | `29 */6 * * *` | schedule only | §13: late, stuck, the deploy | → `kalori-alert` |
| Deploy UI, e2e logic full | — | a push | testing.md | the red run (mailed to the pusher) |
| restore drill | — | by hand, monthly | §6 | — |

## 1. Deploy the UI
A push to `main` touching `app/**` runs *Deploy UI* (`.github/workflows/pages.yml`,
[testing.md](testing.md#ci-githubworkflowspagesyml)): a direct upload (no Git integration) with repo secrets
`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` (Custom token, *Account → Cloudflare Pages → Edit*). By hand from
`app/`: `npm run build`, `npx wrangler pages deploy build-pages --project-name island-fund --branch main` (another
`--branch`: a preview). `404.html` is `index.html` on purpose (the stale-chunk reload needs a real 404). Not served:
re-run the job, read its `wrangler pages deployment list`. Before a model change: `npm run bench` (≤ 15 ms).

## 2. Check the backend
```sh
curl -sS https://island-fund-relay.island-fund-relay.workers.dev/health                     # the Worker and the room
curl -sS https://island-fund-relay.island-fund-relay.workers.dev/api --data '{"action":"health"}'   # the record
```
Both `{"ok":true,…}`; `health.yml` runs them with the site's checks. Red: one down, `dispatch_stopped` (its-bot's
last dispatch > 2 h: its cron or App token, its/README.md "GitHub App"), `relay_cron_stale` (`cronAt` > 2 h). Test:
`gh workflow run health.yml -f simulate=relay_down`. `/health`'s `wx` ([backend](../backend.md#the-real-weather)):
`age` < ~35 min and `hours` > 30 is normal; else `npm run logs -- --event cron.wx --since 2d`, refetch with the signed
admin op `{"op":"wx","refresh":true}` (`relay/scripts/admin.ts`). Daily rows vs the Free plan: `npm run logs -- stats`.

## 3. Rotate a key
Lost phone, leak, any doubt:
1. `openssl rand -hex 32`, into the password manager.
2. From `relay/`: `npx wrangler secret put KEY_A` (or `KEY_B`); the old key is `unauthorized` at once. The same from
   `gym/` and `its/worker/` (the bots hold copies).
3. The person pastes the new key on the app's pairing screen and in their Shortcut's **Key** text.
4. Update the keys file (`~/.config/island-fund/keys` or `KEYS_FILE`): `/admin`'s signature derives from
   `KEY_A:KEY_B` (`relay/src/sign.ts`). Test relay: `relay/.smoke-keys`, `npx wrangler secret bulk .smoke-keys --env
   test`. Remake the secrets bundle (§6).

**`KEY_C`** (guest, relay only): `npx wrangler secret put KEY_C`; `secret delete KEY_C` ends guest access.
**`PLACES_KEY`** (§9): from a 600 file, `npx wrangler secret put PLACES_KEY` (and `--env test`), `gh secret set
RELAY_PLACES_KEY`, a `PLACES_KEY=` line in the keys file; `secret delete PLACES_KEY` turns the places path off.

## 4. A new epoch (rev)
`rev` (`e1`, `e2`, …) changes on a restore (§9) or `node scripts/record.ts rev`; every phone then refetches all rows.

## 5. When sync fails
- 「まだ設定されていません」: the build had no `VITE_LIVE_URL` / `VITE_RECORD_URL`.
- Can't reach the island: the relay (§2, `npx wrangler tail`). `unauthorized`: re-paste the key (app, Shortcut).
- `busy`: > 120 requests/minute a key (retried). `too_large`: > 1 MB: send a baseline in chunks of a few weeks.
- Health numbers didn't move: the `uploads` audit (`ok`, `partial`, `error` with warnings and the body's shape):
```sh
curl -sS https://island-fund-relay.island-fund-relay.workers.dev/api --data "{\"key\":\"$KEY\",\"action\":\"uploads\"}"
```
Each list needs as many lines as `dates`. Fixes: [shortcut §6](shortcut-health-sync.md#6-troubleshooting).

## 6. Backups
The record is the only copy of buys and settings (health can be re-sent:
[shortcut §5](shortcut-health-sync.md#5-one-time-baseline-optional)). PITR keeps 30 days.

- **The daily dump** (`relay/src/archive.ts`, cron `0 18 * * *`): gzipped, age-encrypted to `ARCHIVE_RECIPIENT`,
  `island-record-YYYY-MM-DD.json.gz.age` in release `dumps` of `huangwaylon/fitness-archive` (test: `dumps-test`,
  by hand); 90 kept; `cron.backup` logs it. By hand: `node scripts/record.ts backup [--test]`.
  Token: the GitHub App's (`GH_APP_ID`, `GH_APP_INSTALLATION_ID`, `GH_APP_KEY_RELAY`;
  [its/README](../../its/README.md#github-app)); without it, `no_token`. Emergency fallback only if the App fails: a
  fine-grained PAT (fitness-archive Contents read/write) set as relay secret `ARCHIVE_TOKEN` (not set today). Read one: `gh release
  download dumps -R huangwaylon/fitness-archive -p <name>`, then `record.ts load` or `age -d -i
  ~/.config/island-fund/archive-age.key <name> | gunzip`. Quick check: `node scripts/record.ts verify-dump [date]`.
- **The bots' state** (`archive.ts runBots`): its-bot's `GET /its/status` (`KEY_A`) and gym-bot's `GET /gym/state`
  (secret `GYM_TOKEN`, gym-bot's value) via bindings `ITS_BOT`, `GYM_BOT` → `its-`/`gym-YYYY-MM-DD.json.age`.

**Restore:** a bookmark from before the bad change (§9), or `load <file>` into an empty record, then `rev`. Then
re-check each trip's 共有リンク: a restore revives links turned off since.

**Restore a bot** from its decrypted file (`rm` it after): its/README.md and gym/README.md "Operations".

**The full restore drill** (monthly, this Mac only, ~3 min; the decrypted record never leaves it):
1. `mkdir -m 700 /tmp/restore-drill`; throwaway `KEY_A=`/`KEY_B=`/`KEY_C=` in its `keys`; download the newest
   record, `its-`, `gym-` there (`gh release download … -D /tmp/restore-drill`).
2. From `relay/`: `npx wrangler dev --local --persist-to /tmp/restore-drill/state --port 8790 --ip 127.0.0.1
   --env-file /tmp/restore-drill/keys`; `L` = `env -u KEY_A -u KEY_B -u KEY_C RELAY_ORIGIN=http://127.0.0.1:8790
   KEYS_FILE=/tmp/restore-drill/keys`; `L node scripts/record.ts load <the record file>`.
3. With and without `L`: `counts` (`events` ~1 % fewer), `wallet`, `shopcheck`, `decorcheck`.
4. The bots: `wrangler dev --local --var MODE:off` in `its/worker/` (8799) and `gym/` (8798) with `KEY_A`,
   `ITS_RUNNER_TOKEN`, `GYM_TOKEN`; restore each and read it back equal. Then stop all; `rm -rf /tmp/restore-drill`.

**The secrets bundle:** Cloudflare never shows a secret again, so `~/.config/island-fund/secrets-bundle.age` (600)
holds every Worker and Actions secret this Mac has (person keys, bot tokens, `VAPID_PRIVATE`, LINE's), encrypted to
`archive-age.pub`. Remake after any rotation: `sh relay/scripts/secrets-bundle.sh`; read with `age -d -i
~/.config/island-fund/archive-age.key`. Never committed. Not in it (reissue):
`HEALTH_TOKEN` (relay + test + repo:
[observability](observability.md#the-alert)), `CLOUDFLARE_API_TOKEN` (repo), `ITS_IMAP_USER` /
`ITS_IMAP_APP_PASSWORD` (`its` env: a Gmail app password), `ITS_ADDR` … `ITS_ZOKUGARA` (`its` env, retyped).

## 7. Refresh the official art
From `app/` (needs `cwebp`): `SPECS` in `app/scripts/fetch-assets.ts` → `npm run assets:fetch` (`-- --prune`);
`npm run catalog:build` (`app/scripts/catalog.ts`); `NH_MODELS=~/Downloads/acnh-2.0.0-models/Model npm run icons:nh`
(`app/scripts/nh-icons.ts`); 3D art ([design](../design.md#official-art)): `JOBS` in `app/scripts/models.ts` →
`NH_MODELS=… npm run models` (Chrome). Never commit the model folder.

## 8. Deploy the live relay
[backend.md](../backend.md#live-relay). Once per machine `npx wrangler login`. From `relay/`:
1. `npm ci`, `npm run check`, `npm run knip`, `npm test`.
2. `npm run deploy:test`, `npm run smoke` (keys: gitignored `relay/.smoke-keys`, §3). Every line `ok`.
3. `npm run deploy`. `scripts/deploy.sh` refuses uncommitted changes in `relay/` or `app/src/lib/contract`, or a
   commit not on `origin/main` (migrations are account-wide). Then §2.

**Is the live relay main's?** After `git fetch`:
```sh
sha=$(curl -s https://island-fund-relay.island-fund-relay.workers.dev/health | jq -r .sha)
git merge-base --is-ancestor "$(git log -1 --format=%h origin/main -- relay app/src/lib/contract)" "$sha" && echo current || echo behind
```

**The relay guard:** *Deploy UI* runs that check (`app/scripts/relay-first.ts`), waits 10 min, then fails `deploy
the relay first (runbook §8)`: do steps 1–3, *Re-run failed jobs*. Contract changes (bots' too): the Worker first.
Never `wrangler delete`. **Roll back:** `npx wrangler rollback <version-id>` (migrations can't); the app: `git
revert` + push (`scripts/deploy-order.ts` refuses older runs), or the Pages dashboard's *Rollback*.

## 9. The record
`IslandStore` ([backend.md](../backend.md#the-record)). From `relay/`: `KEY_A=… KEY_B=… node scripts/record.ts
<command>` (keys never on a shared command line or in the repo; else `KEYS_FILE` or the keys file, §3; `--test`;
`RELAY_ORIGIN` + `KEYS_FILE` for a local dev relay). Signs `POST /admin`; its header lists every command.

- **`counts`**: rows per table, `rev`, newest `at`, `schema_v`. **`rev`**: a new epoch (§4).
- **`bookmark [ms]`**, **`restore <bookmark>`** (30 days; `rev` only if the reply's `note` asks), **`dump >
  file.json`** (never in the repo), **`load <file>`** (into an empty record), **`backup`**, **`verify-dump`** (§6).
- **`shopcheck [fix]`, `decorcheck [fix]`**: running counts vs a full fold; `fix` takes the fold's.
- **`adjust <A|B|G> <v> <note>`**: a かいがら correction, only when asked ([backend](../backend.md#shop-adjust));
  undone by −v.
- **Ledgers** ([backend](../backend.md#the-ledger)): `ledger [who]`, `wallet`, `ledgercheck` (cron logs
  `ledger.drift`), `walletset <A|B|G> <h> <note>` (only when asked; backup first), `ledger-retire [dry]` (once; dump
  and `dry` first; refused on a drift).
- **`tomb-prune [dry]`**, **`island-prune [dry]`**: the 03:00 prunes now.
- **`img-set <A|B|G> <custom id> <file> [--ig] [--dry-run]`** (384 px, metadata stripped), **`inbody <A|B> <date>
  <muscle_kg> <smm_kg>`**.
- **`held [A|B]`**, **`promote <person> <date> <metric> [value]`**: held-back zeros; promote one to the day's latest.
- <a id="saved-places"></a>**Saved places** ([backend](../backend.md#saved-places)): the relay fetches nothing (Google
  /sorry-blocks Cloudflare). `places-pull.yml` runs `places-pull [--recent] [--force]` (whole list once in 20 h, none
  within 10 min of a pull), signed with `RELAY_PLACES_KEY`; `places-ids` / `places-details <file>` feed
  `places-details.yml` (docs/places.md "Details"); `places` runs a tick. Parsing broke (`cron.places` error): the last
  good list serves; fix `itemOf`/`parseList`, deploy. Healthy: `/places/status` `syncedAt` < 35 min.

## 10. Pair a phone
Safari → https://island-fund.pages.dev/ → Share → **Add to Home Screen** *first*, then paste the key in the
installed app (it has its own storage). Then the Shortcut: [shortcut-health-sync.md](shortcut-health-sync.md) §2–4.

### The guest
[design](../design.md#the-guest): the same with `KEY_C` (§3), no Shortcut. Send them:

> 1. iPhone の Safari で https://island-fund.pages.dev/ を ひらいて、きょうゆう → **ホーム画面に追加**。
> 2. ホーム画面の しまの貯金箱 を ひらいて、この キーを はりつけて **接続**：`<KEY_C>`
> 3. 設定 → 姿 で すきな すがたと なまえを えらんでね。

## 11. The log
`IslandLog`, 30 days, numbers and enums only: [observability.md](observability.md) (`npm run logs`, the checklist, the
alert, `LOG_OFF`).

## 12. The bots
- ジム (`gym-bot`, LINE): [gym/README.md](../../gym/README.md) "Operations", "Diagnose"; `gym-alert` (§0).
- 保養所 (`its-bot` + the Actions runner): [its/README.md](../../its/README.md) "Operations", "Investigating"
  (`its-alert`, `runner_silent`; Gmail is the ground truth), "Secrets".
- メニューの更新 (Kalori, in 定期処理): §13.

## 13. Refresh Kalori
[food-data "Kalori"](../food-data.md#kalori). `kalori-scrape.yml` (weekly): the crawl (20 shards, 8 at a time, a wip
release keeps progress), a dated release, then the update: merged and deployed within the bands, else a held PR.
its-bot dispatches a missed week (`dispatchKalori`). One run at a time. Pause: `gh workflow disable` (`enable`) both
kalori workflows. `gh run cancel <id>` doesn't stop a queued retry: cancel it too. A publish keeps 3 dated releases
(`kalori_prune.py`). The release `KALORI_TAG` names must exist, published.

1. **A held update** (PR `kalori-update/<tag>`, `HELD` on the failed band; no CI): check the counts
   (~54k items), merge by hand (main's CI deploys and accepts it); reject: close it or `gh release delete <tag>
   --cleanup-tag`. `main_moved`: redo locally (3).
2. **Undo an automatic merge:** `git revert` the "Kalori: <tag> (auto)" commit, push, `gh workflow run pages.yml --ref
   main`, then `GH_REPO=huangwaylon/fitness .github/scripts/kalori-status.sh undo --tag <tag> --fetch-py
   food-data/scripts/fetch.py --kalori app/static/food/kalori.json`.
3. **By hand:** `gh workflow run kalori-scrape.yml` on main (`refetch_before` today: full refetch); a test run `-f
   wip_tag=kalori-wip-<name>` (+ `only_shops` / `max_requests`) never publishes (then `gh release delete
   kalori-wip-<name> --cleanup-tag`). **Locally:** bump `KALORI_TAG` in `food-data/scripts/fetch.py`; `python3 -I
   food-data/scripts/fetch.py kalori`; `python3 -I food-data/scripts/build.py kalori`; `cd app && npm run food:data`;
   `npm run verify`; commit `fetch.py` and `app/static/food/`.

**Alerts:** `status.json` (branch `kalori-status`, 定期処理's メニューの更新 row); `late`, `stuck`, a failing watch:
`kalori-alert`. `drift` / `nonut`: fix fixtures (`food-data/scripts/tests/fixtures/`) and parsers, bump
`PARSER_VERSION` (and `RECORDS_FROM` if records change), dispatch. `limits`, `incomplete`: dispatch (recurring: lower
`total_rate`). `diff_gate` (> 15 % changed or 5 % gone): if right, dispatch with `allow_big_diff`. `band_*`, `tests`,
`main_moved`: held (1). `crash`, `publish`, `update`: the job's log, then dispatch or (3). `deploy_failed`: `gh run
rerun <id>` or undo (2). `reverted`: fix, dispatch. `late` (none in 8 days), `stuck` (a run > 2 days, or `running` 8 h
with no run: `gh run cancel <id>`): dispatch.
