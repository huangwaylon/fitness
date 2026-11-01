# Runbook

Three pieces, no server of our own (plus an optional live relay, §10, which also pushes sheet changes, §11, and sends the goal notification, §12):
- **The data:** the Google Sheet *Island Fund* (append-only rows in `metrics`, `events`, `uploads`).
- **The backend:** the Apps Script bound to it, deployed as a web app (one `/exec` URL, keys `KEY_A`/`KEY_B`).
- **The app:** a static PWA on GitHub Pages that computes everything in the browser from the rows.

First-time setup: [google-setup.md](google-setup.md). How it works: [backend.md](../backend.md).

## 1. Deploy the UI
Push to `main`. Any change under `app/**` (or to the workflow) runs `.github/workflows/pages.yml`:

1. `npm ci --ignore-scripts`, `npm run check`, `npm run knip`, `npx vitest run`
2. `npm run build` with `VITE_GAS_URL` = the repo variable `GAS_URL` and `BASE_PATH=/fitness`
3. `npm run e2e` (Playwright, Chromium) against that build
4. deploy `app/build-pages/` to https://huangwaylon.github.io/fitness/

A red step stops the deploy; pull requests run steps 1–3 only. Re-run: Actions → *Deploy UI to GitHub Pages* →
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
No key needed. `whoami` returns the same `build`.

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
2. Script editor → **Project Settings → Script Properties** → edit `KEY_A` (or `KEY_B`) → **Save**. No redeploy.
   The old key keeps working for up to 5 minutes (key cache), then gets `unauthorized`.
3. That person's app opens the pairing screen: paste the new key. Put it in their Shortcut's **Key** text too.
4. Set the same key on the relay (§10 **Keys**): its sockets and the push's secret (§11) are derived from both keys,
   so until the two sides match the push pauses itself and the phones fall back to polling.

## 5. Resync (REV)
Script Property `REV` is the data revision: when it changes, each phone drops its cache and refetches every row on
its next sync. It changes by itself when `metrics` or `events` is edited by hand (other tabs don't count). After a
hand fix, to be sure: script editor → function menu → `resync` → **Run**.

## 6. When sync fails
| Symptom | Check |
|---|---|
| Site says 「まだ設定されていません」 | `GAS_URL` repo variable unset: google-setup §6 |
| App can't reach the island | §3. HTML → google-setup §9 |
| `unauthorized` | Wrong or rotated key: re-paste it (app) or fix the Shortcut's **Key** |
| `busy` | The lock was held for 10 s, or over 120 requests/minute for that key. The app retries; the Shortcut sends again next run |
| `too_large` | Body over 1 MB: send a long baseline in chunks of a few weeks |
| A hand fix doesn't show on a phone | `resync` (§5) |
| Health numbers didn't move | The `uploads` audit, below |

**The `uploads` audit.** Each `ingest` appends `status` (`ok`, `partial` = lines skipped, `error` = `bad_request`),
`bytes`, and in `error` the warnings, then ` | ` and the body's shape (each field's type, line count, first line:
`steps:text[31] "8564"`; never the key). Read the tab, or your last 20:

```sh
curl -sSL "$GAS_URL" -H 'Content-Type: text/plain;charset=utf-8' --data "{\"key\":\"$KEY\",\"action\":\"uploads\"}"
```

Every list should have as many lines as `dates`. Each run replaces a day's values with Health's current totals (latest wins; a locked week's ベル stay put).
Shortcut fixes: [shortcut §6](shortcut-health-sync.md#6-troubleshooting).

## 7. Backups
The sheet is the only copy of buys and goal changes (health numbers come from Apple Health and can be re-sent:
[shortcut §5](shortcut-health-sync.md#5-one-time-baseline-optional)). Google's version history (File → Version
history) covers bad edits, not a lost file or account.

**Weekly copy** (once, ~5 minutes; a separate standalone script, so the web app keeps its this-sheet-only scope):
1. [script.google.com](https://script.google.com) → **New project** → *Island Fund backup*.
2. Paste:
   ```js
   const SHEET_ID = '…';            // from the sheet URL: /spreadsheets/d/<SHEET_ID>/edit
   const FOLDER_NAME = 'Island Fund backups';
   const KEEP = 12;                 // weekly copies kept (~3 months)

   function backup() {
     const it = DriveApp.getFoldersByName(FOLDER_NAME);
     const folder = it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
     const stamp = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
     DriveApp.getFileById(SHEET_ID).makeCopy(`Island Fund ${stamp}`, folder);
     const files = [];
     for (const f = folder.getFiles(); f.hasNext();) files.push(f.next());
     files.sort((a, b) => b.getDateCreated() - a.getDateCreated()).slice(KEEP).forEach((f) => f.setTrashed(true));
   }
   ```
3. Select `backup` → **Run**, allow Drive access. A copy appears in *Island Fund backups*.
4. **Triggers** (clock) → **Add trigger** → `backup`, *Time-driven*, *Week timer*, Monday, 4–5 am. Google e-mails
   on a failed run.

**Off-Google copy:** monthly, File → Download → `.xlsx`, kept somewhere private.

**Restore:** either paste the copy's rows back into the live tabs (values only, ⌘⇧V) and run `resync` (§5); or make
the copy the live sheet: open it → Extensions → Apps Script (the copy carries the script; paste the current
`Code.js` if in doubt), check `KEY_A`/`KEY_B`, deploy it ([google-setup §4](google-setup.md#4-deploy-the-web-app)), then
set the new `/exec` URL in `GAS_URL` and in both Shortcuts.

## 8. Refresh the official art
The art in `app/static/art/` comes from Nookipedia. Edit `SPECS` in `app/scripts/fetch-assets.ts`, then
`cd app && npm run assets:fetch` (needs `cwebp`: `brew install webp`). The balloon catalogue (its items, recipes, names
and ~2,000 icons) is rebuilt with `npm run catalog:build` (`app/scripts/catalog.ts`; `-- --data` skips the icons); it
prints anything the two sources disagree on.

The 3D-rendered art (the campsite, trees, bushes, lamps, rocks: [design](../design.md#official-art))
comes from NH's own models, a folder of `<Model>.Nin_NX_NVN` folders (Collada `.dae` + PNG textures) kept outside the
repo. Edit `JOBS` in `app/scripts/models.ts`, then `cd app && NH_MODELS=~/Downloads/Model npm run models`
(`-- --only=trees/` for some keys, `--png=/tmp/x` keeps the PNGs; needs Google Chrome and `cwebp`). It copies only the
folders it names into a scratch dir, renders them in Chrome and writes `static/art/<key>.webp`, their manifest entries
(source "rendered") and `src/lib/components/island/models.json`; ~4 s for all. Never commit anything from the model
folder itself. `assets:fetch` keeps rendered entries; a key moved to the renders leaves `SPECS`.

## 9. What the sheet should hold
Exactly three tabs, `metrics`, `events` and `uploads`, with the headers in [backend.md](../backend.md#tabs) (the script
rewrites a wrong header itself). Any other tab (`presence`, `workouts`) is unused: delete it (right-click the tab →
**Delete**; not a synced tab, no `resync`). Rows of an event type or metric the app doesn't know never reach the phones
(`snapshot` leaves them out); deleting them by hand is optional (it bumps `REV`, so each phone refetches once).

## 10. Deploy the live relay
The Cloudflare Worker in `relay/` ([backend.md](../backend.md#live-relay)), on the Workers Free plan of the
umeway1122@gmail.com account. Once per machine: `npx wrangler login`. Then, from `relay/`:

1. `npm ci`, `npm run check`, `npm test`.
2. `npm run deploy:test`, then `npm run smoke` (the test copy; its keys are in the gitignored `relay/.smoke-keys`,
   `KEY_A=…`/`KEY_B=…` lines; new ones: `openssl rand -hex 32` twice, then `npx wrangler secret bulk .smoke-keys --env
   test`). Every line should say `ok`, including the push's (a signed `/notify` reaches both test clients; an unsigned
   or 6-minute-old one gets 401).
3. `npm run deploy` (production). `curl https://island-fund-relay.island-fund-relay.workers.dev/health` → `ok:true`.

**Keys:** the relay's `KEY_A`/`KEY_B` must equal Script Properties'. Set or rotate (§4) with
`npx wrangler secret put KEY_A` and `npx wrangler secret put KEY_B` from `relay/` (it prompts; takes effect at once,
open sockets keep their session until they reconnect). Without them the relay lets nobody in and the app simply has no
live presence. **Logs:** `npx wrangler tail`. **Off switch:** build the app with `VITE_LIVE_URL=` (empty), or
`npx wrangler delete` (the app keeps working without it). A protocol change (`live-protocol.ts`) needs the relay
deployed before the app: an older relay refuses the new kinds.

## 11. Turn on the push
The push ([backend.md](../backend.md#push)) needs the Apps Script to make one outgoing request per write, which takes
the `script.external_request` scope. Until it is granted the code tries, fails silently and pauses (the app works
exactly as before; events still reach the partner at once through the nudge). Adding a scope to a deployed web app
that the owner hasn't authorized breaks every request (*Authorization is required*), so the order matters:

1. (Lead) Add `"https://www.googleapis.com/auth/script.external_request"` to `oauthScopes` in
   `app/apps-script/appsscript.json` and the manifest test (`gas/bundle.test.ts`); **don't commit yet**. From
   `app/apps-script/`, `npx -y @google/clasp@3.4.1 push --force`: it updates the editor's code only; the live
   deployment stays on its version.
2. (Owner, once) Open the sheet → **Extensions → Apps Script**, pick `authorizeRelay` in the function menu → **Run** →
   **Review permissions** → the Island Fund account → **Allow** ("Connect to an external service"). The log should say
   `relay notify: 204`.
3. (Lead) Commit the manifest, `npm run gas:deploy` (§2). `health` must answer the new build (HTML means step 2 was
   skipped: run it, then deploy again).

Check: with the app open on one phone, run the other's Shortcut; the steps update within a few seconds. Off switch:
remove the scope and redeploy (or `npx wrangler delete`): the script pauses itself and polling carries on.

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
