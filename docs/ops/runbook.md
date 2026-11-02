# Runbook

Three pieces, no server of our own (plus an optional live relay, §10, which also pushes sheet changes, §11, and sends the goal notification, §12):
- **The data:** the Google Sheet *Island Fund* (append-only rows in `metrics`, `events`, `uploads`).
- **The backend:** the Apps Script bound to it, deployed as a web app (one `/exec` URL, keys `KEY_A`/`KEY_B`).
- **The app:** a static PWA on GitHub Pages that computes everything in the browser from the rows.

First-time setup: [google-setup.md](google-setup.md). How it works: [backend.md](../backend.md).

## 1. Deploy the UI
Push to `main`. Any change under `app/**` (or to the workflow) runs `.github/workflows/pages.yml`:

1. `npm ci --ignore-scripts`, then beside each other: `npm run build` with `VITE_GAS_URL` = the repo variable `GAS_URL`
   and `BASE_PATH=/fitness` (once), and `npm run check`, `npm run knip`, `npx vitest run`
2. the e2e against that build: Playwright in Chromium (eight shards); WebKit as an iPhone 15 runs nightly on macOS
   (testing.md), gating nothing until it's green across the board
3. deploy `app/build-pages/` to https://huangwaylon.github.io/fitness/

A red step stops the deploy (a flaky test, one that fails and then passes once more, is annotated instead:
[testing.md](testing.md)); pull requests run steps 1–2 only. Re-run: Actions → *Deploy UI to GitHub Pages* →
**Run workflow**. Before a model change, also run `npm run bench` (year 3 compacted ≤ 15 ms).

## 2. Redeploy the Apps Script
After any change to `app/gas/**` or the code it imports:

1. `cd app && npm run gas:build`. It rewrites `app/apps-script/Code.js` and prints the **build** (12 hex: a hash of
   the bundle, also line 3 of `Code.js`). `npx vitest run` fails if the committed `Code.js` is stale.
2. Commit and push.
3. `cd app && npm run gas:deploy`. It refuses a stale `Code.js`, then pushes it, cuts a version, points the existing
   deployment at it and waits until `health` answers the new build. Once per machine: `npx @google/clasp login`
   (the Island Fund account; the Apps Script API on at script.google.com/home/usersettings) and
   `app/apps-script/.clasp.json` (gitignored: the repo is public) with
   `{"scriptId":"<Project Settings>","rootDir":".","deploymentId":"<the /exec one, Deploy → Manage deployments>"}`.

By hand instead: paste `Code.js` into the editor's `Code.gs` and save, then **Deploy → Manage deployments** → pencil on
the existing deployment → **Version: New version** → **Deploy** (saving alone changes nothing: a deployment is pinned
to a version), then check `health` (§3). **Never** *New deployment*: it makes a new `/exec` URL that nothing calls. A
change that needs a new OAuth scope also needs the editor once (Google asks you to authorize it).

## 3. Check the backend
```sh
curl -sSL "$GAS_URL" -H 'Content-Type: text/plain;charset=utf-8' --data '{"action":"health"}'
```
No key needed. The record answers its own (`curl -sS https://island-fund-relay.island-fund-relay.workers.dev/api
--data '{"action":"health"}'` → `{"ok":true,"build":"relay-1"}`); the script's only forwards and exports now, so a
lapse there breaks old phones, a Shortcut still on `/exec` and the sheet's export, not the app.

| Reply | Meaning |
|---|---|
| `{"ok":true,"build":B}`, B = `sed -n 's#^// build: ##p' app/apps-script/Code.js` | Healthy |
| `{"ok":true,"build":B}`, another B | `Code.js` changed but wasn't redeployed: §2 |
| HTML (sign-in / *Authorization is required*) | Authorization lapsed: [google-setup §9](google-setup.md#9-day-8-authorization-check) |
| Anything else, or a timeout | Apps Script down, or a wrong URL |

`.github/workflows/health.yml` runs this every 6 hours (and on demand) while `GAS_URL` is set, and fails (GitHub
e-mails the owner) unless the reply is JSON `ok:true` with the committed build.

## 4. Rotate a key
Lost phone, leak, any doubt:
1. `openssl rand -hex 32`, store it in the password manager.
2. The relay first (it is the record): from `relay/`, `npx wrangler secret put KEY_A` (or `KEY_B`); it takes effect
   at once, the old key gets `unauthorized`.
3. Script editor → **Project Settings → Script Properties** → edit the same key → **Save** (no redeploy): the sheet's
   export is signed with a secret derived from both keys, so until the two sides match the export is refused (§13).
4. That person's app opens the pairing screen: paste the new key. Put it in their Shortcut's **Key** text too.

## 5. A new epoch (rev)
The record's `rev` (`e1`, `e2`, …) is the data revision: when it changes, each phone drops its cache and refetches
every row on its next sync. Nothing changes it by itself (nobody edits the record by hand); after a restore (§13),
`node scripts/record.ts rev`. The sheet's tabs are a copy: an edit there is overwritten by the next export and never
reaches a phone.

## 6. When sync fails
| Symptom | Check |
|---|---|
| Site says 「まだ設定されていません」 | `GAS_URL` repo variable unset: google-setup §6 |
| App can't reach the island | The relay (§10: `/health`, `npx wrangler tail`); Apps Script is the fallback for reads only |
| `unauthorized` | Wrong or rotated key: re-paste it (app) or fix the Shortcut's **Key** |
| `busy` | Over 120 requests/minute for that key. The app retries; the Shortcut sends again next run |
| `too_large` | Body over 1 MB: send a long baseline in chunks of a few weeks |
| Health numbers didn't move | The `uploads` audit, below |

**The `uploads` audit.** Each `ingest` appends `status` (`ok`, `partial` = lines skipped, `error` = `bad_request`),
`bytes`, and in `error` the warnings, then ` | ` and the body's shape (each field's type, line count, first line:
`steps:text[31] "8564"`; never the key). Read the sheet's `uploads` tab (as of the last export), or your last 20:

```sh
curl -sS https://island-fund-relay.island-fund-relay.workers.dev/api --data "{\"key\":\"$KEY\",\"action\":\"uploads\"}"
```

Every list should have as many lines as `dates`. Each run replaces a day's values with Health's current totals (latest wins; a locked week's ベル stay put).
Shortcut fixes: [shortcut §6](shortcut-health-sync.md#6-troubleshooting).

## 7. Backups
The record on the relay is the only copy of buys and goal changes (health numbers come from Apple Health and can be
re-sent: [shortcut §5](shortcut-health-sync.md#5-one-time-baseline-optional)). Three layers:

- **Point-in-time recovery** (the Durable Object's, on the Free plan, the last 30 days): §13 `bookmark` / `restore`.
- **The sheet:** every row, rewritten from the record after each change (≤ 15 minutes) and every night (§9). Google's
  version history (File → Version history) keeps its past states.
- **Off-Google copy:** monthly, `node scripts/record.ts dump > island-record-YYYY-MM-DD.json` from `relay/` (§13),
  kept somewhere private (never in the repo).

**Restore** after a bad change: the record to a bookmark from before it (§13), then `rev`. From a dump or the sheet
into a new, empty record: `load <file>` (a dump), or the sheet's tabs as a dump (`{"rows": {"metrics": [...], "events":
[...], "uploads": [...]}}`, each row its columns in order), then `rev`.

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
folder itself. `assets:fetch` keeps rendered entries; a key moved to the renders leaves `SPECS`. The stone bridge's deck
(`bridges/stone-deck`) is baked into the ground: after re-rendering it, run `npm run terrain` too.

## 9. What the sheet should hold
`README` (what the sheet is: a read-only export, in English and Japanese, the last export's time, the newest row, the
revision, the row counts) and `metrics`, `events` and `uploads`, each with the header in
[backend.md](../backend.md#tabs) and every row of the record. The relay rewrites them whole: anything typed there, or
any other tab's rows put in them, is gone at the next export. The README's time older than a day means the export
fails: §13.

## 10. Deploy the live relay
The Cloudflare Worker in `relay/` ([backend.md](../backend.md#live-relay)), on the Workers Free plan of the
umeway1122@gmail.com account. Once per machine: `npx wrangler login`. Then, from `relay/`:

1. `npm ci`, `npm run check`, `npm test`.
2. `npm run deploy:test`, then `npm run smoke` (the test copy; its keys are in the gitignored `relay/.smoke-keys`,
   `KEY_A=…`/`KEY_B=…` lines; new ones: `openssl rand -hex 32` twice, then `npx wrangler secret bulk .smoke-keys --env
   test`). Every line should say `ok`, including the push's (a signed `/notify` reaches both test clients; an unsigned
   or 6-minute-old one gets 401).
3. `npm run deploy` (production). `curl https://island-fund-relay.island-fund-relay.workers.dev/health` → `ok:true`.

**Keys:** the relay's `KEY_A`/`KEY_B` are the record's keys; Script Properties' must equal them (the export's signature). Set or rotate (§4) with
`npx wrangler secret put KEY_A` and `npx wrangler secret put KEY_B` from `relay/` (it prompts; takes effect at once,
open sockets keep their session until they reconnect). Without them the relay lets nobody in and the app simply has no
live presence. **Logs:** `npx wrangler tail`. **Off switch:** build the app with `VITE_LIVE_URL=` (empty), or
`npx wrangler delete` (the app keeps working without it). A protocol change (`live-protocol.ts`) needs the relay
deployed before the app: an older relay refuses the new kinds.

## 11. Turn on the push
Done (2026-11-01), and since the record moved to the relay (2026-11-02) the push needs no Apps Script at all: the
record tells the room after each write. The script's `script.external_request` scope (granted then, kept in
`appsscript.json`) is what its forward and the export's reply use. Removing it would break both: don't.

## 12. Notifications (VAPID)
The goal notification ([backend.md](../backend.md#notifications)) goes out from the relay, signed with a VAPID key
pair: the public half is `VAPID_PUBLIC` in `relay/wrangler.toml` (production and `env.test`) and `PUSH_PUBLIC_KEY` in
`app/src/lib/sync/push.ts`; the private scalar is the Worker secret `VAPID_PRIVATE` (both copies).

**Turn it on (each phone, iOS 16.4+):** open しまの貯金箱 from the Home Screen icon (not a Safari tab) → tap today's
ベル ribbon → **せってい** → **つうち** → tap 「うめの ぜんぶ たっせいを しらせる」 (or ウェイの) → **許可 / Allow**. The
switch turns green once the relay has the subscription. Turned off by mistake in iOS: Settings → Notifications →
しまの貯金箱 → Allow Notifications, then tap the switch again. Each phone opts in for itself; a person's own report
always goes, the partner's switch decides whether it buzzes.

**Rotate the key** (a leak, or the private key lost; every phone has to tap the switch again only if the old key is
gone, see below):
1. From `relay/`: `node --input-type=module -e "const k=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign']);console.log(Buffer.from(await crypto.subtle.exportKey('raw',k.publicKey)).toString('base64url'));console.error((await crypto.subtle.exportKey('jwk',k.privateKey)).d)" 2>vapid-private.txt`
   prints the public key and writes the private scalar to `vapid-private.txt` (keep it out of git; delete it after).
2. `npx wrangler secret put VAPID_PRIVATE < vapid-private.txt` and the same with `--env test`; put the public key in
   `wrangler.toml` (both places) and `PUSH_PUBLIC_KEY`; `rm vapid-private.txt`.
3. `npm run deploy:test`, `npm run deploy`, then deploy the app (§1). Between the relay deploy and each phone's next
   launch, pushes to that phone fail (the push service refuses the new key for a subscription made with the old one:
   the relay answers `failed` and keeps the subscription); at launch the app sees its subscription's key differs, makes
   a new one and hands it over by itself, so nobody has to tap anything.

**Check by hand:** the smoke test (§10) covers the endpoints' refusals. The whole path once: with the app on two
devices (or one phone and Chrome on a Mac, each paired as one of us) turn つうち on the receiving one, then on the other
let the day reach all four goals (or, from a console there, `fetch('https://island-fund-relay.island-fund-relay.workers.dev/push/goal', {method: 'POST', body: JSON.stringify({key: localStorage['island.key'], date: '<today, Tokyo>', both: false, name: 'test'})}).then(r => r.json())`
→ `{outcome: 'sent'}`; that spends the day for that person). **Logs:** `npx wrangler tail` shows a push service's
refusals (`push <host> <status>`). **Off switch:** `npx wrangler secret delete VAPID_PRIVATE` (reports answer
`failed`, nothing is sent); the switches stay as they are.

## 13. The record
The record is moving from the sheet to the relay's `IslandStore` Durable Object ([backend.md](../backend.md#the-record)).
Every command runs from `relay/` with the two person keys in the environment (never on the command line of a shared
shell, never in a file in the repo): `KEY_A=… KEY_B=… node scripts/record.ts <command>` (`--test`: the test relay,
`KEYS_FILE=.smoke-keys` for its keys).

- **`counts`**: rows per table, the revision (`e1`, `e2`, …: the epoch) and the newest `at`.
- **`import-sheet`**: a full Apps Script snapshot into the record, in chunks of 400 rows, `at` kept, high-fives and
  superseded cosmetic prefs dropped. Idempotent: run it again any time to fill in a copy that didn't land (the relay
  down, a pause after a refusal); it adds only what's missing.
- **`parity`**: the model's numbers per person (ベル by day of every locked week, this week, the wallet and the ledger,
  the ずかん's first finds and tallies, the decorations, the tent, the prefs, each day's goals) from the sheet's snapshot
  and the record's; exits 1 on any difference. 2026-11-02 (step 1): all the same; the sheet 471 metrics + 873 events
  (131 KB), the record 471 + 243 (73 KB: 545 high-fives and 85 superseded prefs not carried over).
- **Backups:** point-in-time recovery works on the Free plan (checked 2026-11-02 on the test relay: a bookmark from
  before an ingest restored the empty record). `bookmark [ms]` prints the bookmark now and `ms` ago (any moment of the
  last 30 days); `restore <bookmark>` restarts the object on it; then `rev`, so every phone refetches. Beyond 30 days:
  `dump > island-record-YYYY-MM-DD.json` (every row; keep it off the repo) and `load <file>` into an empty record.
- **`rev`**: a new epoch: every phone drops its cache and fetches everything on its next refresh.
