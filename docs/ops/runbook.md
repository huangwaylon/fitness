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

**Cloudflare Pages:** project `island-fund` on the island's account (`account_id` in relay/wrangler.toml), direct upload (no Git integration:
the workflow is the gate). Repo secrets `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` (a **Custom token**,
*Account → Cloudflare Pages → Edit*, that account only; `gh secret set …`). By hand, from `app/`: `npm run build`, then
`npx wrangler pages deploy build-pages --project-name island-fund --branch main` (another `--branch` is a preview at
`<branch>.island-fund.pages.dev`). The build writes `build-pages/_headers` (`scripts/headers.ts`) and copies
`index.html` to `404.html` on purpose: a missing chunk then gets a real 404, which the stale-chunk reload relies on.

After the upload, **Pages alias lag** needs nothing; **Deploy not served** (red): re-run the job, then read
`wrangler pages deployment list` in its log. Before a model change, `npm run bench` (year 3 compacted ≤ 15 ms).

## 2. Check the backend
```sh
curl -sS https://island-fund-relay.island-fund-relay.workers.dev/health                     # the Worker and the room
curl -sS https://island-fund-relay.island-fund-relay.workers.dev/api --data '{"action":"health"}'   # the record
```
Both `{"ok":true,…}`. `.github/workflows/health.yml` runs these every 6 hours, fails unless both are ok, warns when
the weather is over 3 hours old, and opens an `alert` issue on a log spike (§11). `/health`'s `wx` is the real weather
([backend](../backend.md#the-real-weather)): `age` (minutes) under ~35 and `hours` ahead over 30 is normal; older, or
`fails` > 0, is Open-Meteo failing (`npx wrangler tail`: `wx-fail <why>`). A fetch now: the signed `/admin` op
`{"op":"wx","refresh":true}` (`relay/scripts/admin.ts` `signed()`).

The Free plan's tightest limit is likely 100k rows written a day: `npm run logs -- stats` (from `relay/`) gives today's
(UTC) per object and `rowsPct`; the alert warns past 50 %.

## 3. Rotate a key
Lost phone, leak, any doubt:
1. `openssl rand -hex 32`, into the password manager.
2. The relay first: from `relay/`, `npx wrangler secret put KEY_A` (or `KEY_B`); the old key is `unauthorized` at once.
3. That person's app shows the pairing screen: paste the new key, and into their Shortcut's **Key** text.
4. The keys file (`~/.config/island-fund/keys`, `KEY_A=…`/`KEY_B=…` lines, or `KEYS_FILE`): the secret that signs
   `/admin` and `/notify` derives from `KEY_A:KEY_B` (`relay/src/notify.ts`), so without the new key there
   `record.ts` and `npm run logs` get `unauthorized`. The test relay's keys: `relay/.smoke-keys`
   (`npx wrangler secret bulk .smoke-keys --env test` after changing them).

The guest's `KEY_C` (§10) is the relay's only (no Shortcut, not in the signature): `npx wrangler secret put KEY_C`
and the guest pastes it. To end their visits: `npx wrangler secret delete KEY_C`.

## 4. A new epoch (rev)
The record's `rev` (`e1`, `e2`, …) is the data revision: when it changes, every phone drops its cache and refetches
every row. Only a restore (§9) or `node scripts/record.ts rev` changes it.

## 5. When sync fails
| Symptom | Check |
|---|---|
| Site says 「まだ 設定されていません」 | The build had no relay URL (`VITE_LIVE_URL`, `VITE_RECORD_URL`) |
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
[shortcut §5](shortcut-health-sync.md#5-one-time-baseline-optional)). Two layers:

- **Point-in-time recovery** (the Durable Object's, the last 30 days): §9 `bookmark` / `restore`.
- **The daily dump** (`relay/src/archive.ts`): at 03:00 Tokyo (cron `0 18 * * *`) the record's alarm dumps it a page
  at a time, gzips it, encrypts it with age to `ARCHIVE_RECIPIENT` and uploads `island-record-YYYY-MM-DD.json.gz.age`
  to the `dumps` release of `huangwaylon/fitness-archive` (test relay: `dumps-test`); the last 90 kept, a failure
  retried. The log's `cron.backup` reports each run; the alert ([observability](observability.md#the-alert)) flags
  none good in 48 h. By hand: `node scripts/record.ts backup [--test]`.
  - **The token:** `ARCHIVE_TOKEN`, a fine-grained GitHub token for that repo only, *Contents: Read and write*:
    `npx wrangler secret put ARCHIVE_TOKEN` (and `--env test`); unset, each run logs `no_token`. Rotate before expiry.
  - **Read one:** `gh release download dumps -R huangwaylon/fitness-archive -p <name>`; `record.ts load` takes it as
    is (decrypted in memory with `~/.config/island-fund/archive-age.key`). By hand: `age -d -i
    ~/.config/island-fund/archive-age.key <name> | gunzip > record.json` (an older `.json.age`: no `gunzip`). The
    secret key is only on the Mac and in the password manager.
  - **The drill** (monthly, writes nothing): `node scripts/record.ts verify-dump [YYYY-MM-DD] [--test]` reads the
    newest dump (or that day's) in memory and prints its rows per table next to the live `counts`; it exits 1 unless
    every table is non-empty and none is above the record's.

**Restore** after a bad change: to a bookmark from before it (§9; the new epoch follows by itself). From a dump into a
new, empty record: `load <file>` (`.age` too), then `rev`.

## 7. Refresh the official art
Nookipedia art in `app/static/art/`: edit `SPECS` in `app/scripts/fetch-assets.ts`, then `npm run assets:fetch` from
`app/` (needs `cwebp`; `-- --prune` drops entries no longer in `SPECS`). The balloon catalogue: `npm run catalog:build`
(`app/scripts/catalog.ts`; prints where the two sources disagree). NH's own icons:
`NH_MODELS=~/Downloads/acnh-2.0.0-models/Model npm run icons:nh` (`app/scripts/nh-icons.ts`).

The 3D-rendered art ([design](../design.md#official-art)): edit `JOBS` in `app/scripts/models.ts`, then
`NH_MODELS=… npm run models` (`-- --only=trees/`; needs Google Chrome and `cwebp`; its header has the rest). Never
commit anything from the model folder itself.

## 8. Deploy the live relay
The Worker in `relay/` ([backend.md](../backend.md#live-relay)), Workers Free plan, the account pinned in its wrangler.toml. Once
per machine: `npx wrangler login`. Then, from `relay/`:

1. `npm ci`, `npm run check`, `npm test`.
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

**Keys:** §3. **Logs:** §11; live: `npx wrangler tail`. No off switch: the relay is the record (never
`npx wrangler delete`). A protocol change (`live-protocol.ts`) deploys the relay before the app.

## 9. The record
The relay's `IslandStore` Durable Object ([backend.md](../backend.md#the-record)). From `relay/`, with the person keys
in the environment (never on a shared shell's command line, never in a repo file): `KEY_A=… KEY_B=… node
scripts/record.ts <command>` (`--test`: the test relay, with `KEYS_FILE=.smoke-keys`; with neither, the keys file:
§3). It signs `POST /admin`.

- **`counts`**: rows per table, `rev`, the newest `at`, `schema_v`.
- **Backups** (§6): `bookmark [ms]` prints the bookmark now or `ms` ago (within 30 days); `restore <bookmark>`
  restarts the object on it (requests meanwhile get `unavailable`, retried). The room starts a new epoch ~5 s later;
  run `rev` only when the reply's `note` says the room wasn't told. `dump > island-record-YYYY-MM-DD.json` (every
  row, held values too; keep it off the repo); `load <file>` into an empty record.
- **`rev`**: a new epoch (§4).
- **`shopcheck {fix?}`, `decorcheck {fix?}`** (admin ops, `scripts/admin.ts`): the running field, shop ledgers and decor
  caps' counts against a full fold of the rows; `fix` takes the fold's. For a sale or placement wrongly refused.
- **`held [A|B]`**: values an ingest held back (a past day's 0 over a higher value), never served, with first/last
  sent and how often. **`promote <person> <date> <metric> [value]`**: makes one the day's latest row (the held row
  stays, marked); refused when nothing is held or it already is.
- **`compact --delete-health-history [max] [rev]`**: **deletes Health history rows**, all of which are kept
  ([backend](../backend.md#the-record) "Compaction"; at most `max`, default 5,000; the admin op also needs
  `confirm: 'delete-health-history'`). **On hold:** the 04:15 Tokyo cron compacts only with `COMPACT_CRON = "1"` in
  wrangler.toml's `[vars]`, which `relay/test/compact.test.ts` forbids. Dump first.

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

## 12. ITS investigating
The 保養所ボット's Worker and runner: [its/README.md](../../its/README.md) (Operations, Diagnose, Secrets). A run in one
timeline: `cd its/worker && npm run its:logs -- <run>[-<attempt>]`, then `rm -rf` the decrypted dir it names. The
`its-alert` issue and what each reason means: [observability.md](observability.md#its-investigating). Gmail (the
site's mails) is the ground truth for holds and 予約確定. Rotating a token both sides share: 停止 → change both → 開始.

**Push** (its/README.md "Push"). Turning it on, once: `cd its/worker && npm run vapid:keys --
~/.config/its-bot/vapid-private` → put the printed `VAPID_PUBLIC=…` in wrangler.toml's `[vars]` and commit it →
`npx wrangler secret put VAPID_PRIVATE < ~/.config/its-bot/vapid-private` → `npm run deploy` → `/its/status`'s
`push.vapidPublic` is the new key. Rotating VAPID: the same steps with a new file (the script never overwrites one);
the phones see the key change and re-subscribe at their next refresh (until then Apple answers 403, logged
`outcome=config`). The hand check after a deploy that touches push (Playwright's WebKit has no push service):
1. macOS Safari, the site, ボット → 保養所 → 通知 on → テスト通知: a notification within seconds;
   `npx wrangler tail --search "its push"` shows `status=201 outcome=ok` (a `403 reason=BadJwtToken` here: the two
   halves of the pair don't match).
2. Each iPhone, the Home Screen app (a Safari tab can't subscribe): 通知 on, テスト通知, locked screen shows it; tap
   opens 保養所.
3. The next real hold: the notification on both phones (`its push queued kind=… subs=…`).
