# Runbook

Two pieces, no server of our own:
- **The relay** (`relay/`, a Cloudflare Worker on the Free plan, §10): the record (metrics, events, the ingest audit in
  a Durable Object's SQLite, §13), the live room (presence and the day's shared world). No notifications (§12).
- **The app:** a static PWA on Cloudflare Pages (https://island-fund.pages.dev/, project `island-fund`; until the phones
  have moved, also https://huangwaylon.github.io/fitness/) that computes everything in the browser from the record's rows.
No Google Sheet any more: its export was removed on 2026-11-05 (§2). How it works: [backend.md](../backend.md).

## 1. Deploy the UI
Push to `main`. Any change under `app/**` (or to the workflow) runs `.github/workflows/pages.yml`:

1. `npm ci --ignore-scripts`, then beside each other: `npm run build` with `BASE_PATH=/fitness` (once, and again with
   `BASE_PATH=''` for Cloudflare), and `npm run check`, `npm run knip`, `npx vitest run`
2. the e2e against that build: Playwright in Chromium (twelve shards); WebKit as an iPhone 15 runs nightly on macOS
   (testing.md), gating nothing until it's green across the board
3. deploy the root build to Cloudflare Pages (https://island-fund.pages.dev/, `wrangler pages deploy`, then a check that
   it answers this build with its headers), and the `/fitness` one to https://huangwaylon.github.io/fitness/

**Cloudflare Pages:** the project `island-fund` on the umeway1122@gmail.com account (direct upload, no Git integration:
this workflow is the gate). CI needs two repo secrets: `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` (dash.cloudflare.com
→ My Profile → API Tokens → Create Token → **Custom token**: permission *Account → Cloudflare Pages → Edit*, account
resources: that one account; then `gh secret set CLOUDFLARE_API_TOKEN` and `gh secret set
CLOUDFLARE_ACCOUNT_ID`). By hand, from `app/`: `BASE_PATH= npm run build`, then `npx wrangler pages deploy build-pages
--project-name island-fund --branch main` (any `--branch` but `main` is a preview at `<branch>.island-fund.pages.dev`).
The headers (CSP, nosniff, no-referrer, Permissions-Policy, HSTS, the immutable cache) are `build-pages/_headers`,
written by the build ([testing.md](testing.md) "The headers"). GitHub Pages can't set headers: its copy has only the
`<meta>` CSP.

A red step stops the deploy (a flaky test, one that fails and then passes once more, is annotated instead:
[testing.md](testing.md)); pull requests run steps 1–2 only. Re-run: Actions → *Deploy UI to GitHub Pages* →
**Run workflow**. Before a model change, also run `npm run bench` (year 3 compacted ≤ 15 ms).

## 2. The Google Sheet (removed 2026-11-05)
The record was exported to a Google Sheet (*Island Fund*) by an Apps Script web app (project *Island Fund web app*)
until 2026-11-05 ([decisions](../decisions.md#sheet-export-removed-2026-11-05)). The relay sends Google nothing now,
and the repo has no Apps Script code. The sheet and the script's deployment still sit in that Google account,
unwritten, as of that day; delete them there when they're no longer wanted (Drive: the sheet; script.google.com: the
project, Deploy → Manage deployments → archive). The backups are §7.

## 3. Check the backend
```sh
curl -sS https://island-fund-relay.island-fund-relay.workers.dev/health                     # the Worker and the room
curl -sS https://island-fund-relay.island-fund-relay.workers.dev/api --data '{"action":"health"}'   # the record
```
Both `{"ok":true,…}`. `.github/workflows/health.yml` runs these every 6 hours (and on demand) and fails (GitHub e-mails
the owner) unless both are ok. The relay's `wx` is the real weather ([backend](../backend.md#the-real-weather)):
`age` (minutes since the last good fetch) under ~35 and `hours` ahead over 30 is normal. An older one or `fails` > 0
means Open-Meteo is failing (`npx wrangler tail` shows `wx-fail <why>`); the phones keep the last timeline for 36
hours, then the game's weather. The workflow warns past 3 hours. A fetch now: the signed `/admin` op
`{"op":"wx","refresh":true}` (signed as `relay/scripts/smoke.ts` signs it).

## 4. Rotate a key
Lost phone, leak, any doubt:
1. `openssl rand -hex 32`, store it in the password manager.
2. The relay first (it is the record): from `relay/`, `npx wrangler secret put KEY_A` (or `KEY_B`); it takes effect
   at once, the old key gets `unauthorized`.
3. That person's app opens the pairing screen: paste the new key. Put it in their Shortcut's **Key** text too.

The guest's key (`KEY_C`, §14) is the relay's only: `npx wrangler secret put KEY_C` (from `relay/`, it prompts) and the
guest pastes the new one. No Shortcut, and the server-to-server signature (`/admin`, `/notify`) never involves it. To end the
guest's visits: `npx wrangler secret delete KEY_C` (the next request is `unauthorized`: their app shows the pairing
screen).

## 5. A new epoch (rev)
The record's `rev` (`e1`, `e2`, …) is the data revision: when it changes, each phone drops its cache and refetches
every row on its next sync. Nothing changes it by itself (nobody edits the record by hand); after a restore (§13),
`node scripts/record.ts rev`.

## 6. When sync fails
| Symptom | Check |
|---|---|
| Site says 「まだ設定されていません」 | The build had no relay URL (`VITE_LIVE_URL` and `VITE_RECORD_URL` emptied) |
| App can't reach the island | The relay (§3, §10: `npx wrangler tail`) |
| `unauthorized` | Wrong or rotated key: re-paste it (app) or fix the Shortcut's **Key** |
| `busy` | Over 120 requests/minute for that key. The app retries; the Shortcut sends again next run |
| `too_large` | Body over 1 MB: send a long baseline in chunks of a few weeks |
| Health numbers didn't move | The `uploads` audit, below |

**The `uploads` audit.** Each `ingest` appends `status` (`ok`, `partial` = lines skipped, `error` = `bad_request`),
`bytes`, and in `error` the warnings, then ` | ` and the body's shape (each field's type, line count, first line:
`steps:text[31] "8564"`; never the key). Read your last 20:

```sh
curl -sS https://island-fund-relay.island-fund-relay.workers.dev/api --data "{\"key\":\"$KEY\",\"action\":\"uploads\"}"
```

Every list should have as many lines as `dates`. Each run replaces a day's values with Health's current totals (latest wins; a locked week's ベル stay put).
Shortcut fixes: [shortcut §6](shortcut-health-sync.md#6-troubleshooting).

## 7. Backups
The record on the relay is the only copy of buys and goal changes (health numbers come from Apple Health and can be
re-sent: [shortcut §5](shortcut-health-sync.md#5-one-time-baseline-optional)). Two layers:

- **Point-in-time recovery** (the Durable Object's, on the Free plan, the last 30 days): §13 `bookmark` / `restore`.
- **The dump:** monthly, `node scripts/record.ts dump > island-record-YYYY-MM-DD.json` from `relay/` (§13),
  kept somewhere private (never in the repo).

**Restore** after a bad change: the record to a bookmark from before it (§13), then `rev`. From a dump into a new, empty record: `load <file>`, then `rev`.

## 8. Refresh the official art
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

## 9. (The sheet: removed 2026-11-05, §2)

## 10. Deploy the live relay
The Cloudflare Worker in `relay/` ([backend.md](../backend.md#live-relay)), on the Workers Free plan of the
umeway1122@gmail.com account. Once per machine: `npx wrangler login`. Then, from `relay/`:

1. `npm ci`, `npm run check`, `npm test`.
2. `npm run deploy:test`, then `npm run smoke` (the test copy; its keys are in the gitignored `relay/.smoke-keys`,
   `KEY_A=…`/`KEY_B=…` lines; new ones: `openssl rand -hex 32` twice, then `npx wrangler secret bulk .smoke-keys --env
   test`). Every line should say `ok`, including the push's (a signed `/notify` reaches both test clients; an unsigned
   or 6-minute-old one gets 401).
3. `npm run deploy` (production). `curl https://island-fund-relay.island-fund-relay.workers.dev/health` → `ok:true`.

**Keys:** the relay's `KEY_A`/`KEY_B` are the record's keys. Set or rotate (§4) with
`npx wrangler secret put KEY_A` and `npx wrangler secret put KEY_B` from `relay/` (it prompts; takes effect at once,
open sockets keep their session until they reconnect). Without them the relay lets nobody in and the app simply has no
live presence. **Logs:** `npx wrangler tail`. **Off switch:** build the app with `VITE_LIVE_URL=` (empty), or
`npx wrangler delete` (the app keeps working without it). A protocol change (`live-protocol.ts`) needs the relay
deployed before the app: an older relay refuses the new kinds.

## 11. Turn on the push
Done (2026-11-01), and since the record moved to the relay (2026-11-02) the push needs no Apps Script at all: the
record tells the room after each write. The script's `script.external_request` scope went with its forward
(2026-11-02): it makes no outgoing request.

## 12. Notifications removed
There are none since 2026-11-02 ([decisions](../decisions.md#no-notifications-2026-11-02)). Done in this order: the
app that unsubscribes a phone's old Web Push subscription on open (deployed to Pages first), then the relay without
the `/push/*` routes (they answer 410; test relay, then production), then the secrets: `npx wrangler secret delete
VAPID_PRIVATE` and `npx wrangler secret delete VAPID_PRIVATE --env test` (the vars `VAPID_PUBLIC` and `VAPID_SUBJECT`
went with `wrangler.toml`). On a phone that had つうち on, iOS may still list しまの貯金箱 under Settings →
Notifications; it gets nothing (no subscription is left), and the entry can be switched off there or left.

## 13. The record
The record is the relay's `IslandStore` Durable Object ([backend.md](../backend.md#the-record)). Every command runs from
`relay/` with the two person keys in the environment (never on the command line of a shared shell, never in a file in
the repo): `KEY_A=… KEY_B=… node scripts/record.ts <command>` (`--test`: the test relay, `KEYS_FILE=.smoke-keys` for its
keys). It signs `POST /admin` with the server-to-server secret.

- **`counts`**: rows per table, the revision (`e1`, `e2`, …: the epoch), the newest `at`.
- **Backups:** point-in-time recovery works on the Free plan (checked 2026-11-02 on the test relay: a bookmark from
  before an ingest restored the empty record). `bookmark [ms]` prints the bookmark now and `ms` ago (any moment of the
  last 30 days); `restore <bookmark>` restarts the object on it; then `rev`, so every phone refetches. Beyond 30 days:
  `dump > island-record-YYYY-MM-DD.json` (every row; keep it off the repo) and `load <file>` into an empty record.
- **History:** on 2026-11-02 the sheet's rows were imported (`at` kept; 545 high-fives and 85 superseded prefs left
  out) and the model's numbers per person from both (ベル by day of every locked week, this week, the wallet and the
  ledger, the ずかん, the decorations, the tent, the prefs, each day's goals) were the same; then each write was copied
  here until the app wrote here itself.
- **`rev`**: a new epoch: every phone drops its cache and fetches everything on its next refresh.

## 14. Pair a phone
On each iPhone: open https://island-fund.pages.dev/ in Safari → Share → **Add to Home Screen** *first*, open
the app from the icon, paste that person's key (the password manager). iOS gives the Home Screen app its own storage,
so a key entered in Safari isn't seen there; a `https://island-fund.pages.dev/#key=<key>` link works only when opened inside the installed
app. Then the Shortcut: [shortcut-health-sync.md](shortcut-health-sync.md) §2–4.

<a id="4b-the-guest"></a>**The guest** ([design](../design.md#the-guest)): the same steps with `KEY_C` (a Worker secret,
§4; `openssl rand -hex 32`, kept in the password manager), and no Shortcut (the guest has no health data). Send them:

> 1. iPhone の Safari で https://island-fund.pages.dev/ を ひらいて、きょうゆう → **ホーム画面に追加**。
> 2. ホーム画面の しまの貯金箱 を ひらいて、この キーを はりつけて **つなぐ**：`<KEY_C>`
> 3. せってい → むらびと で すきな むらびとと なまえを えらんでね。
>
> (English: open the link in Safari on the iPhone, Share → **Add to Home Screen**; open the app from the icon and
> paste the key, then **Connect**; pick a villager and a name in Settings → Villager.)

The app then opens on the island as 「おきゃくさん」; its villager comes ashore while its app is open.

## Telemetry (the phones' health of the app)

The paired phones (the guest's too) send the relay a small anonymous record (app/src/lib/sync/telemetry.ts → the
record's `telemetry` action): a JS error's message, the top of its stack and its file:line (at most three a session,
each once), and once a session, 10 s after the 3D island is up, its cold load's time and the display's frames over
5 s (p50 / p95 frame time, fps, long frames, the island's own drawn rate), with the device in a word (iOS's version,
the Home Screen app or Safari, the screen's size). Who sent it isn't kept, nor anything of theirs; never the demo,
never under automation. The record keeps the newest 500 and takes at most 200 a day (store.ts TELEMETRY_KEEP /
TELEMETRY_PER_DAY: well inside the Free plan). Read them from `relay/`:

    KEY_A=… KEY_B=… node scripts/record.ts telemetry [n]

(`--test` and `KEYS_FILE=…` for the test relay, as the other commands.)
