# Runbook

Two pieces, no server of our own:
- **The relay** (`relay/`, a Cloudflare Worker on the Free plan, §8): the record (a Durable Object's SQLite, §9), the
  live room, the log (§11).
- **The app:** a static PWA on Cloudflare Pages (https://island-fund.pages.dev/, project `island-fund`), computing
  everything in the browser from the record's rows.
How it works: [backend.md](../backend.md). Code and workflows cite these sections by number: renumber them together.

## 1. Deploy the UI
Push to `main`: any change under `app/**` runs *Deploy UI* (`.github/workflows/pages.yml`), jobs in
[testing.md](testing.md#ci-githubworkflowspagesyml).

**Cloudflare Pages:** project `island-fund` on the island's account (`account_id` in relay/wrangler.toml), direct
upload (no Git integration: the workflow is the gate). Repo secrets `CLOUDFLARE_ACCOUNT_ID` and
`CLOUDFLARE_API_TOKEN` (a **Custom token**, *Account → Cloudflare Pages → Edit*, that account only; `gh secret set
…`). By hand, from `app/`: `npm run build`, then
`npx wrangler pages deploy build-pages --project-name island-fund --branch main` (another `--branch` is a preview at
`<branch>.island-fund.pages.dev`). The build writes `build-pages/_headers` (`scripts/headers.ts`) and copies
`index.html` to `404.html` on purpose: a missing chunk then gets a real 404, which the stale-chunk reload relies on.

**Deploy not served** (red; [testing "CI"](testing.md#ci-githubworkflowspagesyml)): re-run the job, then read
`wrangler pages deployment list` in its log. Before a model change, `npm run bench` (year 3 compacted ≤ 15 ms).

## 2. Check the backend
```sh
curl -sS https://island-fund-relay.island-fund-relay.workers.dev/health                     # the Worker and the room
curl -sS https://island-fund-relay.island-fund-relay.workers.dev/api --data '{"action":"health"}'   # the record
```
Both `{"ok":true,…}`. `.github/workflows/health.yml` runs these with the site's checks (`version.json`, CSP
and the relay's CORS for it). GitHub drops most scheduled runs, so its-bot's cron dispatches health.yml and
its-health.yml (`its/worker/src/dispatch.ts` `dueHealth`, its `GH_DISPATCH_TOKEN`; `its health-dispatch refused`
warns); each workflow's own schedule is the backstop. health.yml's last dispatch over 2 h old is `dispatch_stopped`
(red, in the `alert` issue): its-bot's cron dead or its token lapsed (expiry unknown; every dispatch `status=401`):
rotate a fine-grained PAT (this repo, Actions
read/write) with `npx wrangler secret put GH_DISPATCH_TOKEN` in `its/worker`. `/health`'s `cronAt` over 2 h old is
`relay_cron_stale` (red): the relay's :15/:45 cron stopped (weather, wet days). Red (GitHub mails the owner) unless all pass; it warns when the weather is over 3 hours old or no phone logged in 24 h, and opens an `alert` issue on a log spike (§11). `/health`'s
`wx` is the real weather ([backend](../backend.md#the-real-weather)): `age` (minutes) under ~35 and `hours` ahead over
30 is normal; older, or `fails` > 0, is Open-Meteo failing (`npm run logs -- --event cron.wx --since 2d`: each failed
fetch's `fail` code; `wrangler tail`'s `wx-fail` for a hello's). A fetch now: the signed `/admin` op
`{"op":"wx","refresh":true}` (`relay/scripts/admin.ts` `signed()`).

Rows written (the Free plan's 100k a day, likely its tightest limit): `npm run logs -- stats` (from `relay/`), today's
(UTC) per object and `rowsPct`; the alert past 50 %.

## 3. Rotate a key
Lost phone, leak, any doubt:
1. `openssl rand -hex 32`, into the password manager.
2. The relay first: from `relay/`, `npx wrangler secret put KEY_A` (or `KEY_B`); the old key is `unauthorized` at once.
   Then the same `secret put` from `gym/` and `its/worker/` (the bots hold copies).
3. That person's app shows the pairing screen: paste the new key, and into their Shortcut's **Key** text.
4. The keys file (`~/.config/island-fund/keys`, `KEY_A=…`/`KEY_B=…` lines, or `KEYS_FILE`): the secret that signs
   `/admin` derives from `KEY_A:KEY_B` (`relay/src/sign.ts`), so without the new key there
   `record.ts` and `npm run logs` get `unauthorized`. The test relay's keys: `relay/.smoke-keys`
   (`npx wrangler secret bulk .smoke-keys --env test` after changing them). Then the secrets bundle (§6).

The guest's `KEY_C` (§10) is the relay's only (no Shortcut, not in the signature): `npx wrangler secret put KEY_C`
and the guest pastes it. To end their visits: `npx wrangler secret delete KEY_C`.

`PLACES_KEY` (the places pull's, §9): `openssl rand -hex 32` into a 600 file, `npx wrangler secret put PLACES_KEY`
(and `--env test`) from stdin, `gh secret set RELAY_PLACES_KEY` from the same file, a `PLACES_KEY=` line in the keys
file. It signs the places ops only; `npx wrangler secret delete PLACES_KEY` turns that path off.

## 4. A new epoch (rev)
The record's `rev` (`e1`, `e2`, …) is the data revision: when it changes, every phone drops its cache and refetches
every row. Only a restore (§9) or `node scripts/record.ts rev` changes it.

## 5. When sync fails
| Symptom | Check |
|---|---|
| Site says 「まだ設定されていません」 | The build had no relay URL (`VITE_LIVE_URL`, `VITE_RECORD_URL`) |
| App can't reach the island | The relay (§2; `npx wrangler tail`) |
| `unauthorized` | Wrong or rotated key: re-paste it (app) or fix the Shortcut's **Key** |
| `busy` | Over 120 requests/minute for that key; the app paces and retries, the Shortcut sends again next run |
| `too_large` | Body over 1 MB: send a long baseline in chunks of a few weeks |
| Health numbers didn't move | The `uploads` audit, below |

**The `uploads` audit.** Each `ingest` appends `status` (`ok`, `partial` = lines skipped, `error`), `bytes`, and on
`error` the warnings and the body's shape (`steps:text[31] "8564"`; never the key). Your last 20:

```sh
curl -sS https://island-fund-relay.island-fund-relay.workers.dev/api --data "{\"key\":\"$KEY\",\"action\":\"uploads\"}"
```

Every list should have as many lines as `dates`. What a run replaces and held zeros: [backend](../backend.md#ingest)
"Latest wins"; §9 `held`, `promote`. Shortcut fixes: [shortcut §6](shortcut-health-sync.md#6-troubleshooting).

## 6. Backups
The record is the only copy of buys and goal changes (health can be re-sent:
[shortcut §5](shortcut-health-sync.md#5-one-time-baseline-optional)). **Only on Cloudflare:** the record (dumped
nightly, below), the bots' state (dumped with it), the Workers' secrets (the secrets bundle, below), and the log and the
room's day ring (not needed: neither is a record). Two layers:

- **Point-in-time recovery** (the Durable Object's, the last 30 days): §9 `bookmark` / `restore`.
- **The daily dump** (`relay/src/archive.ts`): at 03:00 Tokyo (cron `0 18 * * *`) the record's alarm dumps it a page
  at a time, gzips it, encrypts it with age to `ARCHIVE_RECIPIENT` and uploads `island-record-YYYY-MM-DD.json.gz.age`
  to the `dumps` release of `huangwaylon/fitness-archive` (test relay: `dumps-test`); the last 90 kept, a failure
  retried. The log's `cron.backup` reports each run; the alert ([observability](observability.md#the-alert)) flags
  none good in 48 h. By hand: `node scripts/record.ts backup [--test]`.
  - **The token:** the GitHub App's ([its/README](../../its/README.md#github-app); secrets `GH_APP_ID`,
    `GH_APP_INSTALLATION_ID`, `GH_APP_KEY_RELAY`, prod and `--env test`), narrowed to that repo's contents; else
    `ARCHIVE_TOKEN`, the fallback PAT. `cron.backup` `by`: whose. Neither: `no_token`.
  - **Read one:** `gh release download dumps -R huangwaylon/fitness-archive -p <name>`; `record.ts load` takes it
    (decrypted in memory with `~/.config/island-fund/archive-age.key`, only on the Mac and in the password manager).
    By hand: `age -d -i <that key> <name> | gunzip > record.json`.
  - **The drill** (monthly, writes nothing): `node scripts/record.ts verify-dump [YYYY-MM-DD] [--test]` reads the
    newest dump (or that day's) in memory and prints its rows per table next to the live `counts`; it exits 1 unless
    every table is non-empty and none is above the record's; then the newest `its-`/`gym-` files' counts (bookings,
    events, settings present; the gym state's version), exit 1 if either is missing or isn't its state.
- **The bots' state** (`archive.ts runBots`, [decisions](../decisions.md#the-bots-state-in-the-nightly-backup)): the same
  run, after the record's upload, reads its-bot's `GET /its/status` (with the relay's `KEY_A`) and gym-bot's `GET
  /gym/state` (with the relay's secret `GYM_TOKEN`, gym-bot's value: `npx wrangler secret put GYM_TOKEN`) through the
  service bindings `ITS_BOT`, `GYM_BOT`, and uploads `its-`/`gym-YYYY-MM-DD.json.age` (not gzipped), 90 of each.
  `cron.backup`'s `its`, `gym`: `ok`, `none` (no binding or credential), `http_<n>`, `bad`, `github_<step>_<n>`; a
  failure makes the line a warning, never the record's `ok`. Read one: `age -d -i ~/.config/island-fund/archive-age.key
  its-<day>.json.age > its.json`.

**Restore** after a bad change: to a bookmark from before it (§9; the new epoch follows by itself). From a dump into a
new, empty record: `load <file>` (`.age` too), then `rev`. **共有リンク after a restore:** either kind brings back the
links as they were then, so a link turned off since is live again: list each trip's 共有リンク in the app (or `counts`'
`share`) and turn off again any that had been (the dump carries `share` and `share_visit`; the day's hashes and salt
start afresh).

**Restore a bot** from its file (decrypted as above; `rm` it after): **its-bot** (its/README.md "Operations"): `PUT
/its/settings` with the file's `.settings` and `baseUpdatedAt` = the live status's `settings.updatedAt`, then its
`.bookings` in chunks of ≤ 50 to `POST /runner/bookings` with the runner token (ids kept: a re-run adds nothing), then
`POST /its/run` `{action: "stop"|"start"}` as `.settings.paused` says (a PUT leaves `paused` alone). Events and seen
names aren't restored (the runner's history). **gym-bot**: `curl -fsS -X PUT -H "Authorization: Bearer
$GYM_TOKEN" --data-binary @gym.json $URL/gym/state` (gym/README.md "Operations").

**The full restore drill** (monthly, on this Mac only: the decrypted record never leaves it; ~3 min, 2026-11-20):
1. `mkdir -m 700 /tmp/restore-drill`; three throwaway keys `KEY_A=`/`KEY_B=`/`KEY_C=` + `openssl rand -hex 32` in
   `/tmp/restore-drill/keys`; `gh release download dumps -R huangwaylon/fitness-archive -D /tmp/restore-drill -p <name>`
   for the newest `island-record-`, `its-`, `gym-` (4 s).
2. From `relay/`: `npx wrangler dev --local --persist-to /tmp/restore-drill/state --port 8790 --ip 127.0.0.1
   --env-file /tmp/restore-drill/keys` (ready in ~10 s). `record.ts` reaches it with `RELAY_ORIGIN=http://127.0.0.1:8790
   KEYS_FILE=/tmp/restore-drill/keys` and the shell's `KEY_*` unset (`env -u KEY_A -u KEY_B -u KEY_C …`): call that `L`.
3. `L node scripts/record.ts load /tmp/restore-drill/island-record-….json.gz.age` (1 s for ~12k rows).
4. Against prod, the same commands with and without `L`: `counts` (metrics, uploads, img, share, share_visit equal;
   events fewer only by removals' tombstones whose target is gone and superseded states of a slot: a load keeps what the
   fold needs, so 58 of 5,988 on 11-20), `wallet` (each `h` equal, less activity since the dump), `shopcheck`,
   `decorcheck` (same), and the trip notes' key names (travel.md "Private values": every trip, `hiking`'s six).
5. The bots: `wrangler dev --local` in `its/worker/` (port 8799) and `gym/` (8798), `--var MODE:off`, an env file with
   `KEY_A`, `ITS_RUNNER_TOKEN`, `GYM_TOKEN`; restore each from its decrypted file (above) and read it back equal.
6. Stop the three dev servers; `rm -rf /tmp/restore-drill` (the local state holds the record).

**The secrets bundle.** Cloudflare never shows a secret again, so `~/.config/island-fund/secrets-bundle.age` (600)
holds every Worker secret this Mac has a copy of, by Worker and name, plus the GitHub Actions secrets with a copy,
encrypted to `archive-age.pub`. Remake it after any rotation: `sh relay/scripts/secrets-bundle.sh`. Read it: `age -d -i
~/.config/island-fund/archive-age.key ~/.config/island-fund/secrets-bundle.age`. Never committed or uploaded; the user
keeps a copy in the password manager next to the age key. No copy anywhere (reissue, never restore):

| Secret | Where | Reissuing costs |
|---|---|---|
| `ARCHIVE_TOKEN` | relay, relay-test | A fine-grained PAT (fitness-archive, Contents read/write), `secret put` both; meanwhile backups say `no_token` |
| `HEALTH_TOKEN` | relay, relay-test, repo | `openssl rand -hex 32`, three puts ([observability](observability.md#the-alert)); meanwhile the log's alert is off |
| `GH_DISPATCH_TOKEN` | its-bot | A PAT (fitness, Actions read/write: its/README.md "Secrets"); meanwhile 開始 and the watchdog can't dispatch |
| `CLOUDFLARE_API_TOKEN` | repo | A Cloudflare API token (Pages edit), `gh secret set`; meanwhile the UI doesn't deploy |
| `ITS_IMAP_USER`, `ITS_IMAP_APP_PASSWORD` | `its` env | A new Gmail app password; meanwhile `mail_failing`, holds finished by hand |
| `ITS_ADDR` … `ITS_ZOKUGARA` (the applicant's 12) | `its` env | Typed again from the member's details; meanwhile the 申込 leg can't fill the form |

The person keys (and so the Shortcut's **Key**), the bots' tokens, `VAPID_PRIVATE` (the phones' ボット push) and LINE's
are all in the bundle.

## 7. Refresh the official art
Nookipedia art in `app/static/art/`: edit `SPECS` in `app/scripts/fetch-assets.ts`, then `npm run assets:fetch` from
`app/` (needs `cwebp`; `-- --prune` drops entries no longer in `SPECS`). The balloon catalogue: `npm run catalog:build`
(`app/scripts/catalog.ts`; prints where the two sources disagree). NH's own icons:
`NH_MODELS=~/Downloads/acnh-2.0.0-models/Model npm run icons:nh` (`app/scripts/nh-icons.ts`).

The 3D-rendered art ([design](../design.md#official-art)): edit `JOBS` in `app/scripts/models.ts`, then
`NH_MODELS=… npm run models` (`-- --only=trees/`; needs Google Chrome and `cwebp`; its header has the rest). Never
commit anything from the model folder itself.

## 8. Deploy the live relay
The Worker in `relay/` ([backend.md](../backend.md#live-relay)), Workers Free plan, the account pinned in its
wrangler.toml. Once per machine: `npx wrangler login`. Then, from `relay/`:

1. `npm ci`, `npm run check`, `npm run knip`, `npm test`.
2. `npm run deploy:test`, then `npm run smoke` against the test copy (keys: gitignored `relay/.smoke-keys`; new ones:
   `openssl rand -hex 32` twice, then `npx wrangler secret bulk .smoke-keys --env test`). Every line should say `ok`.
3. `npm run deploy` (production). `scripts/deploy.sh` refuses uncommitted changes in `relay/` or
   `app/src/lib/contract`, or a commit not on `origin/main` (push, then `git fetch`): the Durable Object migrations
   are the account's, so a branch deploy blocks main's. Then §2's `/health` → `ok:true`.

**Is the live relay main's?** Each deploy stamps its commit in `/health`'s `sha` and the deployment message
(`npx wrangler deployments list`; a test deploy from a dirty tree: `<sha>-dirty`). After `git fetch`:
`sha=$(curl -s https://island-fund-relay.island-fund-relay.workers.dev/health | jq -r .sha); git merge-base
--is-ancestor "$(git log -1 --format=%h origin/main -- relay app/src/lib/contract)" "$sha" && echo current || echo
behind` (`null`: an unstamped deploy).

**The relay guard.** *Deploy UI*'s `deploy` runs the same check before wrangler (`app/scripts/relay-first.ts`: the
last commit touching what the Worker bundles, `RELAY_PATHS`, tests aside), since a phone drops what an older relay
refuses. It waits up to 10 min for the live relay to have it, then is red, `deploy the relay first (runbook §8)`:
deploy the relay (steps 1–3), then *Re-run failed jobs*.

**Keys:** §3. **Logs:** §11; live: `npx wrangler tail`. No off switch: the relay is the record (never
`npx wrangler delete`). A protocol or contract change: the relay first (steps 1–3), then the app (a push under
`app/**` deploys it once the relay guard passes; a change of `contract/` is under `app/**`, so its own push waits). The bots' contracts the same: the Worker (`gym/`, `its/worker/`)
first, then the app.

**Roll back.** The relay: `npx wrangler deployments list`, then `npx wrangler rollback <version-id>`; a Durable Object
migration can't be rolled back. The app: `git revert` and push (the deploy's order guard, `scripts/deploy-order.ts`,
refuses re-running an older run); in a hurry, the Pages dashboard's *Rollback* on an older deployment, and the next
push deploys over it.

## 9. The record
The relay's `IslandStore` Durable Object ([backend.md](../backend.md#the-record)). From `relay/`, with the person keys
in the environment (never on a shared shell's command line, never in a repo file): `KEY_A=… KEY_B=… node
scripts/record.ts <command>` (`--test`: the test relay, with `KEYS_FILE=.smoke-keys`; with neither, the keys file:
§3; `RELAY_ORIGIN=http://127.0.0.1:<port>` with `KEYS_FILE`: a local `wrangler dev`, §6's drill). It signs `POST /admin`.

- **`counts`**: rows per table, `rev`, the newest `at`, `schema_v`.
- **Backups** (§6): `bookmark [ms]` prints the bookmark now or `ms` ago (within 30 days); `restore <bookmark>`
  restarts the object on it (requests meanwhile get `unavailable`, retried). The room starts a new epoch ~5 s later;
  run `rev` only when the reply's `note` says the room wasn't told. `dump > island-record-YYYY-MM-DD.json` (every
  row, held values too; keep it off the repo); `load <file>` into an empty record (a dump's ledger as it was; without one, seeded from the rows'
  fold at each person's first op; a load never moves a ledger that is there).
- **`rev`**: a new epoch (§4).
- **`shopcheck [fix]`, `decorcheck [fix]`**: the running field and decor caps' counts against a full fold of the
  rows; `fix` takes the fold's. For a placement wrongly refused.
- **`adjust <A|B|G> <v> <note>`**: a correction of one person's かいがら, only when asked: a `shop_adjust` row of `v`
  ([backend](../backend.md#shop-adjust)), its id and the かいがら before/after printed; undone by another of −v.
- **The ledgers** ([backend](../backend.md#the-ledger)): **`ledger [who]`** the parts (a person: their ops),
  **`wallet`** each `h` and the fold beside it, **`ledgercheck`** the drifts (cron: `ledger.drift`), **`walletset
  <A|B|G> <h> <note>`** `h` set, logged. Only when asked; backup first.
  **`ledger-retire [dry]`**: the shop's history deleted, once (dump first, `dry` first; refused on a drift).
- **`tomb-prune [dry]`**: the 03:00 cron's removals' prune now (`contract/tomb.ts`); `dry` the count and ids.
- **`img-set <A|B|G> <custom id> <file> [--ig] [--dry-run]`**: a picture (384 px JPEG/WebP, no metadata:
  `sips`/`magick -strip` first) set on that person's マイ食品 as its owner would; `--ig` an illustration (イメージ).
  The pictures ride in `dump`/`load` (`imgdump`/`imgload` pages) and `counts.img`.
- **`held [A|B]`**: values an ingest held back (a past day's 0 over a higher value), never served, with first/last
  sent and how often. **`promote <person> <date> <metric> [value]`**: makes one the day's latest row (the held row
  stays, marked); refused when nothing is held or it already is.
- <a id="saved-places"></a>**Saved places** ([backend](../backend.md#saved-places)): no Mac job, and the relay fetches
  nothing (Google /sorry-blocks Cloudflare). `places-pull.yml` (GitHub Actions, dispatched by
  its-bot at :15/:45, its schedule the backstop) runs `places-pull [--recent] [--force]` (the list fetched there into
  the relay: admin `places_ingest`; one Google request a run, the whole once in 20 h; skipped after a pull in 10 min).
  Details: `places-details.yml` (its-bot, 18:30 UTC; `force` by hand), docs/places.md "Details". **Parsing broke** (`cron.places` error): the last good list serves; fix
  `itemOf`/`parseList` against a fetch of `listUrl` (the fixture is scrubbed), deploy. **Google `/sorry`** on the
  runner (the pull's warning says the code): the next run tries again; 3 h unpulled, health.yml's alert (`placesH`). One secret, `RELAY_PLACES_KEY` (the relay's
  `PLACES_KEY`, §3: `places_status`/`places_ingest`/`places_ids`/`places_details` only, each signature once; `record.ts` signs those with
  it when `PLACES_KEY` is in the environment); its log shows HTTP codes and counts only. Healthy: `/places/status` `syncedAt` < 35 min.

## 10. Pair a phone
On each iPhone: open https://island-fund.pages.dev/ in Safari → Share → **Add to Home Screen** *first*, open the app
from the icon, paste that person's key. The Home Screen app has its own storage, so a key entered in Safari isn't seen
there; a `https://island-fund.pages.dev/#key=<key>` link works only inside the installed app. Then the Shortcut:
[shortcut-health-sync.md](shortcut-health-sync.md) §2–4.

### The guest
[design](../design.md#the-guest): the same with `KEY_C` (§3), no Shortcut. Send them:

> 1. iPhone の Safari で https://island-fund.pages.dev/ を ひらいて、きょうゆう → **ホーム画面に追加**。
> 2. ホーム画面の しまの貯金箱 を ひらいて、この キーを はりつけて **接続**：`<KEY_C>`
> 3. 設定 → 姿 で すきな すがたと なまえを えらんでね。

## 11. The log
The phones' and the relay's structured events in `IslandLog` for 30 days, numbers and enums only: what is logged,
`npm run logs`, the checklist, the alert and `LOG_OFF`: [observability.md](observability.md).

## 12. The bots
Each bot's doc has its deploy, rollback, secrets, stop switch, health checks, alerts and fixes:
- ジム (`gym-bot`, LINE): [gym/README.md](../../gym/README.md) "Operations", "Diagnose"; the `gym-alert` issue (health.yml's `gym` job: `verdict_broken`, `checks_stale`,
  `status_unreachable`).
- 保養所 (`its-bot` + the Actions runner): [its/README.md](../../its/README.md) "Operations", "Investigating" (the
  `its-alert` issue, `runner_silent`; Gmail is the ground truth), "Secrets" (its tokens and their rotation).
- メニュー (Kalori): §13.

## 13. Refresh Kalori
The chain menus ([food-data "Kalori"](../food-data.md#kalori)). `kalori-scrape.yml` runs weekly (Wednesday 02:41
JST): the crawl's rounds, a dated release, then the update: merged into main and deployed by itself within the
bands, else held as a PR. GitHub drops scheduled runs, so its-bot's cron dispatches the week's run (`-f weekly=true`)
on a Tuesday tick from 18:41 to 20:41 UTC unless a weekly run is unfinished or was created since a day before the
schedule (`its/worker/src/dispatch.ts` `dispatchKalori` has the rules; `wrangler tail`'s `its kalori-dispatch`); the
schedule stays the backstop, and a weekly run that finds a dated
release published in the last 12 h stops before the canary (a late tick after the dispatch's refresh). Pause: `gh workflow disable kalori-scrape.yml` and `kalori-watch.yml` (`enable`). Cancelling a
run (`gh run cancel <id>`) stops its own retry, not one already queued: cancel that too (`gh run list -w
kalori-scrape.yml`). One run at a time: a new dispatch or the schedule replaces a pending retry run; the wip
release keeps the progress. Its 20 shards run 8 at a time (Actions' 20 jobs are account-wide), the rest queued: a round can take up to three
shard budgets.
Releases: each publish is marked Latest and deletes the dated ones past the newest 3, never the pinned one (`kalori_prune.py`); a held PR older than three publishes names a deleted release: close it.
0. **Bootstrap** (once): the release main's `KALORI_TAG` names must exist, published (not a draft or prerelease):
   setup seeds every refresh from it and refuses to start without it.
1. **A held update** (the PR `kalori-update/<tag>`, its body the gate table, `HELD` on the band that failed; no CI
   runs on it): read the counts (items ~54k), then merge it by hand: the push to main runs the full CI and the
   deploy, and accepts the release. Reject it: close the PR (or `gh release delete <tag> --cleanup-tag`): the next
   refresh starts again from the accepted one. `main_moved`: its branch sits on the old main, so redo it locally (3).
   Actions may not open PRs here: the status links the branch's compare page.
2. **Undo an automatic merge:** `git revert <the "Kalori: <tag> (auto)" commit>`, push, `gh workflow run pages.yml
   --ref main`, then `GH_REPO=huangwaylon/fitness .github/scripts/kalori-status.sh undo --tag <tag> --fetch-py
   food-data/scripts/fetch.py --kalori app/static/food/kalori.json` from the reverted main (its run no longer counts
   toward the bands; the two files put the restored dataset in status.json). The next refresh seeds from the restored `KALORI_TAG`.
3. **By hand** (`gh workflow run kalori-scrape.yml`, on main: another branch never publishes): `refetch_before` today
   for a full refetch. A test: `-f wip_tag=kalori-wip-<name>` (with `only_shops` or `max_requests`):
   never publishes or writes the status; its wip release goes when its shards end well, else `gh release delete
   kalori-wip-<name> --cleanup-tag` (with `only_shops`, a shard owning none of them exits 0 with nothing to do). **Locally**: bump `KALORI_TAG` in `food-data/scripts/fetch.py`; `python3 -I
   food-data/scripts/fetch.py kalori`; `python3 -I food-data/scripts/build.py kalori`; `cd app && npm run
   food:data`; the tests and `npm run verify`; commit `fetch.py` and `app/static/food/`.

**Alerts:** `status.json` on the `kalori-status` branch (`kalori-scrape.yml`, `kalori-watch.yml`); an alert is a dot on
the bots page's メニュー tab with its run and PR, no email. A healthy run clears it. Each reason:
- `drift`: kalori.jp changed its pages. Update the fixtures (`food-data/scripts/tests/fixtures/`) and the parsers until
  the tests pass, bump `PARSER_VERSION` (and `RECORDS_FROM` to it when the records change: a full
  refetch), dispatch. `nonut` (the no-nutrition cap, marks undone):
  likely a parser miss on a new page kind; fix it the same way.
- `limits`, `incomplete`: dispatch again (the wip keeps the progress); recurring: a lower `total_rate`, or kalori.jp
  blocking runners.
- `diff_gate` (over 15 % changed or 5 % gone: not published): a real change or a parser fix, checked by eye →
  dispatch with `allow_big_diff` (published, then held: merge its PR, 1); a redesign → as `drift`.
- `band_*` (the PR's table says which), `tests`, `main_moved`: held (1).
- `crash`, `publish`, `update`: the job's log (update-merge refusing update-build's files: a dependency to suspect);
  dispatch again once fixed, or do it locally (3).
- `deploy_failed`: Deploy UI failed twice, or its dispatch failed or was never seen: its log; re-run it (`gh run
  rerun <id>`), or undo (2).
- `reverted`: Food data checks failed on the merge, so main has its revert: the checks' log; fix, then dispatch.
- `late` (no finished refresh, scheduled or dispatched, in 8 days), `stuck` (a run over 2 days, or a `running` status
  8 h old with no run: `gh run cancel <id>`): dispatch.
