# Runbook

Two pieces, no server of our own:
- **The relay** (`relay/`, a Cloudflare Worker on the Free plan, §8): the record (metrics, events, the ingest audit in
  a Durable Object's SQLite, §9), the live room (presence and the day's shared world), the log (§11).
- **The app:** a static PWA on Cloudflare Pages (https://island-fund.pages.dev/, project `island-fund`) that computes
  everything in the browser from the record's rows.
How it works: [backend.md](../backend.md). Code and workflows cite these sections by number: renumber them together.

## 1. Deploy the UI
Push to `main`. Any change under `app/**` (or to the workflow) runs *Deploy UI* (`.github/workflows/pages.yml`): the
checks and the gate's e2e (4 shards in logic mode, each building) side by side, then the deploy to Cloudflare Pages and
a check that the site answers this build with its headers; after it, the full logic tier (6 shards). The jobs, the
gate's selection and the flaky ledger: [testing.md](testing.md#ci-githubworkflowspagesyml). `health.yml` checks the
site every 6 hours too.

**Cloudflare Pages:** the project `island-fund` on the umeway1122@gmail.com account (direct upload, no Git integration:
this workflow is the gate). CI needs two repo secrets: `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` (dash.cloudflare.com
→ My Profile → API Tokens → Create Token → **Custom token**: permission *Account → Cloudflare Pages → Edit*, account
resources: that one account; then `gh secret set CLOUDFLARE_API_TOKEN` and `gh secret set
CLOUDFLARE_ACCOUNT_ID`). By hand, from `app/`: `npm run build`, then `npx wrangler pages deploy build-pages
--project-name island-fund --branch main` (any `--branch` but `main` is a preview at `<branch>.island-fund.pages.dev`).
The headers (CSP, nosniff, no-referrer, Permissions-Policy, HSTS, the immutable cache, the models as application/x-protobuf so Cloudflare compresses them) are `build-pages/_headers`,
written by the build ([testing.md](testing.md) "The headers"). The build also copies `index.html` to `404.html` on
purpose: with a top-level `404.html` Pages answers a missing file (an old build's chunk, an asset) with a real 404, not
its single-page fallback's `index.html` and 200, which the app's stale-chunk reload relies on.

A red gate stops the deploy; pull requests run the gate without the deploy. After the upload: a **Pages alias lag**
warning (the deployment's own URL serves the build, island-fund.pages.dev not yet after 6 min) needs nothing, it
catches up (check the site later); **Deploy not served** (red: neither URL serves it) means the upload didn't take:
re-run the job, then look at `wrangler pages deployment list` in its log. Re-run: Actions → *Deploy UI* →
**Run workflow**. Before a model change, also run `npm run bench` (year 3 compacted ≤ 15 ms).

## 2. Check the backend
```sh
curl -sS https://island-fund-relay.island-fund-relay.workers.dev/health                     # the Worker and the room
curl -sS https://island-fund-relay.island-fund-relay.workers.dev/api --data '{"action":"health"}'   # the record
```
Both `{"ok":true,…}`. `.github/workflows/health.yml` runs these every 6 hours (and on demand) and fails (GitHub e-mails
the owner) unless both are ok, and opens an `alert` issue when the log spikes (§11). The relay's `wx` is the real weather ([backend](../backend.md#the-real-weather)):
`age` (minutes since the last good fetch; `/health` asks the room once a minute) under ~35 and `hours` ahead over 30 is normal. An older one or `fails` > 0
means Open-Meteo is failing (`npx wrangler tail` shows `wx-fail <why>`); the phones keep the last timeline for 36
hours, then the game's weather. The workflow warns past 3 hours. A fetch now: the signed `/admin` op
`{"op":"wx","refresh":true}` (`relay/scripts/admin.ts` `signed()`, as `relay/scripts/smoke.ts` sends it).

The Free plan's tightest limit is likely its 100k rows written a day: `npm run logs -- stats` (from `relay/`) says
today's (UTC) by object (`rowsLog`, `rowsStore`, `rowsRoom`) and `rowsPct`; the alert warns past 50 % (§11).

## 3. Rotate a key
Lost phone, leak, any doubt:
1. `openssl rand -hex 32`, store it in the password manager.
2. The relay first (it is the record): from `relay/`, `npx wrangler secret put KEY_A` (or `KEY_B`); it takes effect
   at once, the old key gets `unauthorized`.
3. That person's app opens the pairing screen: paste the new key. Put it in their Shortcut's **Key** text too.
4. The admin tools' keys file (`~/.config/island-fund/keys`, `KEY_A=…`/`KEY_B=…` lines, or `KEYS_FILE`): the
   server-to-server secret that signs `/admin` and `/notify` is derived from `KEY_A:KEY_B` (`relay/src/notify.ts`), so
   it changes with either key; without the new key there `record.ts` and `npm run logs` get `unauthorized`. The test
   relay's keys are `relay/.smoke-keys` (`npx wrangler secret bulk .smoke-keys --env test` after changing them).

The guest's key (`KEY_C`, §10) is the relay's only: `npx wrangler secret put KEY_C` (from `relay/`, it prompts) and the
guest pastes the new one. No Shortcut, and the server-to-server signature (`/admin`, `/notify`) never involves it. To end the
guest's visits: `npx wrangler secret delete KEY_C` (the next request is `unauthorized`: their app shows the pairing
screen).

## 4. A new epoch (rev)
The record's `rev` (`e1`, `e2`, …) is the data revision: when it changes, each phone drops its cache and refetches
every row on its next sync (an open phone at once: a new epoch sends `changed`). Nothing changes it but a restore
(§9: a new epoch follows by itself a few seconds after the restart) or `node scripts/record.ts rev` (nobody edits the
record by hand; run it after a restore whose reply says the room wasn't told).

## 5. When sync fails
| Symptom | Check |
|---|---|
| Site says 「まだ 設定されていません」 | The build had no relay URL (`VITE_LIVE_URL` and `VITE_RECORD_URL` emptied) |
| App can't reach the island | The relay (§2, §8: `npx wrangler tail`) |
| `unauthorized` | Wrong or rotated key: re-paste it (app) or fix the Shortcut's **Key** |
| `busy` | Over 120 requests/minute for that key. The app paces its writes (≤ ~100 a minute) and retries; the Shortcut sends again next run |
| `too_large` | Body over 1 MB: send a long baseline in chunks of a few weeks |
| Health numbers didn't move | The `uploads` audit, below |

**The `uploads` audit.** Each `ingest` appends `status` (`ok`, `partial` = lines skipped, `error` = `bad_request`),
`bytes`, and in `error` the warnings, then ` | ` and the body's shape (each field's type, line count, first line:
`steps:text[31] "8564"`; never the key). Read your last 20:

```sh
curl -sS https://island-fund-relay.island-fund-relay.workers.dev/api --data "{\"key\":\"$KEY\",\"action\":\"uploads\"}"
```

Every list should have as many lines as `dates`. Each run replaces a day's values with Health's current totals (latest wins; a locked week's ベル stay put), except that a past day never drops to 0 from a value above it (`N past zeros held` in the notes: a run that read nothing, Health locked; the 0 is kept apart, never served: §9 `held`, and `promote` when it was a real correction).
Shortcut fixes: [shortcut §6](shortcut-health-sync.md#6-troubleshooting).

## 6. Backups
The record on the relay is the only copy of buys and goal changes (health numbers come from Apple Health and can be
re-sent: [shortcut §5](shortcut-health-sync.md#5-one-time-baseline-optional)). Two layers:

- **Point-in-time recovery** (the Durable Object's, on the Free plan, the last 30 days): §9 `bookmark` / `restore`.
- **The daily dump, on the relay** (`relay/src/archive.ts`): at 03:00 Tokyo the cron (`0 18 * * *`) hands it to the
  record's alarm, which dumps it (the file `record.ts dump` writes), encrypts it with age to the public key in
  `ARCHIVE_RECIPIENT` and uploads `island-record-YYYY-MM-DD.json.age` to the `dumps` release of the private
  `huangwaylon/fitness-archive` (the test relay: `dumps-test`), replacing that day's; the last 90 are kept. A failure is
  retried after 30 min, doubling to 6 h. The log's `cron.backup` says each run (`npm run logs -- --event cron.backup`);
  the alert ([observability](observability.md#the-alert)) flags none good in 48 h. By hand: `node scripts/record.ts
  backup [--test]`.
  - **The token:** `ARCHIVE_TOKEN`, a fine-grained GitHub token for that repo only, *Contents: Read and write*
    (Metadata read comes with it). `npx wrangler secret put ARCHIVE_TOKEN` from `relay/` (and `--env test`); unset,
    each run logs `no_token` and uploads nothing. Rotate it the same way before it expires.
  - **Read one:** `gh release download dumps -R huangwaylon/fitness-archive -p island-record-YYYY-MM-DD.json.age`, then
    `age -d -i ~/.config/island-fund/archive-age.key island-record-YYYY-MM-DD.json.age > record.json` (the secret key is
    only on the Mac and in the password manager).

**Restore** after a bad change: the record to a bookmark from before it (§9; the new epoch follows by itself: `counts` shows the new rev a few seconds on). From a dump into a new, empty record: `load <file>`, then `rev`.

## 7. Refresh the official art
The art in `app/static/art/` comes from Nookipedia. Edit `SPECS` in `app/scripts/fetch-assets.ts`, then
`cd app && npm run assets:fetch` (needs `cwebp`: `brew install webp`). The balloon catalogue (its items, recipes, names
and ~2,000 icons) is rebuilt with `npm run catalog:build` (`app/scripts/catalog.ts`; `-- --data` skips the icons); it
prints anything the two sources disagree on.

The 3D-rendered art (the campsite, trees, bushes, lamps, rocks, the stone bridge: [design](../design.md#official-art))
comes from NH's own models, a folder of `<Model>.Nin_NX_NVN` folders (Collada `.dae` + PNG textures) kept outside the
repo. Edit `JOBS` in `app/scripts/models.ts`, then `cd app && NH_MODELS=~/Downloads/Model npm run models`
(`-- --only=trees/` for some keys, `--png=/tmp/x` keeps the PNGs; needs Google Chrome and `cwebp`). It copies only the
folders it names into a scratch dir, renders them in Chrome and writes `static/art/<key>.webp`, their manifest entries
(source "rendered") and `src/lib/components/island/models.json`; ~4 s for all. Never commit anything from the model
folder itself. `assets:fetch` keeps rendered entries; a key moved to the renders leaves `SPECS`.

## 8. Deploy the live relay
The Cloudflare Worker in `relay/` ([backend.md](../backend.md#live-relay)), on the Workers Free plan of the
umeway1122@gmail.com account. Once per machine: `npx wrangler login`. Then, from `relay/`:

1. `npm ci`, `npm run check`, `npm test`.
2. `npm run deploy:test`, then `npm run smoke` (the test copy; its keys are in the gitignored `relay/.smoke-keys`,
   `KEY_A=…`/`KEY_B=…` lines; new ones: `openssl rand -hex 32` twice, then `npx wrangler secret bulk .smoke-keys --env
   test`). Every line should say `ok`, including the `/notify` checks (a signed one reaches both test clients; an unsigned or
   6-minute-old one gets 401), the admission (a socket without its ticket, or with one under an unknown key, is
   refused: the smoke's clients make tickets) and the log's.
3. `npm run deploy` (production), only from a commit that is on `origin/main` (push first: the Durable Object
   migrations are the account's, so a deploy from a branch blocks everyone else's from main). `curl https://island-fund-relay.island-fund-relay.workers.dev/health` → `ok:true`.

**Keys:** the relay's `KEY_A`/`KEY_B` are the record's keys. Set or rotate (§3) with
`npx wrangler secret put KEY_A` and `npx wrangler secret put KEY_B` from `relay/` (it prompts; takes effect at once,
open sockets keep their session until they reconnect); then the keys file (§3). Without them nobody can read or
write the record. **Logs:** the log (§11, `npm run logs`); live: `npx wrangler tail`. There is no off switch: the relay
is the record (never `npx wrangler delete`: it deletes the record's Durable Object); the log alone turns off with
`LOG_OFF` (§11). A protocol change (`live-protocol.ts`) needs the relay
deployed before the app: an older relay refuses the new kinds.

## 9. The record
The record is the relay's `IslandStore` Durable Object ([backend.md](../backend.md#the-record)). Every command runs from
`relay/` with the two person keys in the environment (never on the command line of a shared shell, never in a file in
the repo): `KEY_A=… KEY_B=… node scripts/record.ts <command>` (`--test`: the test relay, `KEYS_FILE=.smoke-keys` for its
keys; without either, the keys file: §3). It signs `POST /admin` with the server-to-server secret.

- **`counts`**: rows per table, the revision (`e1`, `e2`, …: the epoch), the newest `at`.
- **Backups:** point-in-time recovery works on the Free plan (tested on the test relay: a bookmark from before an
  ingest restored the empty record). `bookmark [ms]` prints the bookmark now and `ms` ago (any moment of the
  last 30 days); `restore <bookmark>` restarts the object on it (from the moment it's asked until the restart every request is answered `unavailable`, which the phones retry: nothing is acknowledged that the bookmark then drops; a Shortcut run in those seconds is covered by its next one), and the room (told before the restart, its own storage) calls the restored record ~5 s later (retrying every 30 s, 10 tries) to start a new epoch, so every phone refetches; only when the reply's `note` says the room wasn't told, run `rev` yourself. Beyond 30 days:
  the daily dump (§6), or `dump > island-record-YYYY-MM-DD.json` (every row, the held values too, fetched a page at a time: the admin's `dump` pages by default, 10,000 rows; keep it off the repo) and `load <file>` into an empty record.
- **`rev`**: a new epoch: every phone drops its cache and fetches everything on its next refresh.
- **`counts`** also says `schema_v` (the record's migrations run). The admin ops `shopcheck
  {fix?}` and `decorcheck {fix?}` (signed like the rest: `scripts/admin.ts`) compare the record's running shop ledgers
  and decor caps' counts with a full fold of the rows; `fix` takes the fold's. Run them if a sale or a placement is
  refused when it shouldn't be.
- **`held [A|B]`**: the values an ingest held back (a past day's 0 over a value above it, [backend](../backend.md#ingest)
  "Latest wins"), never served; each with when it was first and last sent and how often. **`promote <person> <date>
  <metric> [value]`**: one of them made a row of that day (the day's latest from then on, the phones get it at their
  next refresh); the held row stays, marked. Refused when nothing is held or it is already the latest.
- **`compact --delete-health-history [max] [rev]`** (refused without the flag; the admin op refuses without `confirm:
  'delete-health-history'`: it **deletes Health history rows**, which are all kept): the record's compaction now ([backend](../backend.md#the-record) "Compaction": the
  `metrics` rows of locked weeks the model no longer reads, by the phones' rule; at most `max` deletes, default 5,000).
  **On hold:** the cron runs it at 04:15 Tokyo only with `COMPACT_CRON = "1"` in wrangler.toml's `[vars]`, unset
  (`relay/test/compact.test.ts` fails while it's set anywhere: lifting the hold changes that test too), so nothing is
  compacted until the owners decide (dump first, then turn it on; the log's
  `cron.compact`: `deleted`, `more` while a backlog remains). `rev` starts a new epoch after it (the phones refetch the smaller record; not needed: their caches compact
  by the same rule). A dump taken after it has only the compacted rows (a locked day's history within it is gone; what the
  model reads is all there).

## 10. Pair a phone
On each iPhone: open https://island-fund.pages.dev/ in Safari → Share → **Add to Home Screen** *first*, open
the app from the icon, paste that person's key (the password manager). iOS gives the Home Screen app its own storage,
so a key entered in Safari isn't seen there; a `https://island-fund.pages.dev/#key=<key>` link works only when opened inside the installed
app. Then the Shortcut: [shortcut-health-sync.md](shortcut-health-sync.md) §2–4.

### The guest
[design](../design.md#the-guest): the same steps with `KEY_C` (a Worker secret,
§3; `openssl rand -hex 32`, kept in the password manager), and no Shortcut (the guest has no health data). Send them:

> 1. iPhone の Safari で https://island-fund.pages.dev/ を ひらいて、きょうゆう → **ホーム画面に追加**。
> 2. ホーム画面の しまの貯金箱 を ひらいて、この キーを はりつけて **つなぐ**：`<KEY_C>`
> 3. せってい → むらびと で すきな むらびとと なまえを えらんでね。
>
> (English: open the link in Safari on the iPhone, Share → **Add to Home Screen**; open the app from the icon and
> paste the key, then **Connect**; pick a villager and a name in Settings → Villager.)

The app then opens on the island as 「おきゃくさん」; its villager comes ashore while its app is open.

## 11. The log
The phones' and the relay's structured events in the relay's `IslandLog` object for 30 days, numbers and enums only:
what is logged, how to read it (`npm run logs` from `relay/`), the investigating checklist, the alert (`health.yml`
opens an `alert` issue on a spike) and the off switch (`LOG_OFF`): [observability.md](observability.md).
