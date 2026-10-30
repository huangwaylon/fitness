# Runbook: Island Fund (ADR 0015)

Three pieces, no server of our own:
- **The data:** the Google Sheet *Island Fund* (append-only rows).
- **The backend:** the Apps Script bound to it, deployed as a web app (`/exec` URL, two per-person keys).
- **The app:** a static PWA on GitHub Pages. It computes the ベル and the shared wallet in the browser from the sheet's rows (ADR 0019, 0022).

Contract: [`docs/design/sheets-architecture.md`](../design/sheets-architecture.md).

## 1. One-time setup (the canonical order; the other docs link here)
1. **Sheet, script, keys, deploy:** [google-setup.md](google-setup.md) §1–5, ending with the `whoami` curl.
2. **Point the Pages build at it:** `gh variable set GAS_URL --body 'https://script.google.com/macros/s/…/exec'`,
   then re-run the *Deploy UI to GitHub Pages* workflow (or push). Until `GAS_URL` is set, the site shows
   「まだ設定されていません / Not set up yet」 with a link to the demo.
3. **Shortcut on each phone:** [shortcut-health-sync.md](shortcut-health-sync.md) §2–4 (health sync), §5 (gym
   Arrive/Leave), §6 (the optional 84-day baseline).
4. **Pair the phones:** on each iPhone open https://huangwaylon.github.io/fitness/ in Safari → Share →
   **Add to Home Screen** *first*, open it from the icon, and paste that person's key ([google-setup.md §7](google-setup.md#7-pairing-the-phones)).
5. **Day 8 or later:** run the `whoami` curl again ([google-setup.md §9](google-setup.md#9-does-it-need-the-shared-finances-cloud-project-or-a-published-consent-screen)).

## 2. Deploying the UI
Every push to `main` that touches `app/**` runs `.github/workflows/pages.yml`: `npm ci`, `npm run build` with
`VITE_GAS_URL=${{ vars.GAS_URL }}`, upload `app/build-pages/`. Locally: `cd app && npm run build` (output
`build-pages/`), `npx vite preview` to try it, `npm run dev` for development (without `VITE_GAS_URL` in `.env` it
runs on demo data). The site has a strict CSP (a `<meta>` tag): it can only talk to itself and the Apps Script
origins. Before a model change: `npx vitest run`, `npm run check`, `npm run bench` (rows from ≈ hourly Shortcut runs at years 1 and 3;
year 3 compacted with a `rev` should stay ≤ 15 ms for reduce + view) and `npx knip` (`app/knip.json`).

Backend code changes (`app/gas/**`, the parser): google-setup.md §11 (`npm run gas:build`, paste, **new version on
the existing deployment**, never a new deployment).

## 3. Keys
- Rotate (lost phone, leak, any doubt): google-setup.md §10. The old key gets `unauthorized`, so that person's app
  opens the pairing screen: paste the new key there, and into their Shortcuts.
- Keys live only in Script Properties, the phones' app storage and the Shortcuts. Never in the repo or a URL that
  gets shared (the `#key=` fragment isn't sent to any server, but don't post the link).

## 4. Shortcuts
- Health sync: [shortcut-health-sync.md](shortcut-health-sync.md) (URL → `/exec`, body gets `key` + `action:"ingest"`,
  no `Authorization` header).
- Gym Arrive/Leave: same doc, §5.

## 5. Monitoring and the deployed version
**The probe** (no key, costs no Properties read, takes no lock, touches no sheet):

```sh
curl -sSL "$GAS_URL" -H 'Content-Type: text/plain;charset=utf-8' --data '{"action":"health"}'
# → {"ok":true,"build":"<12 hex>"}
```

| Reply | Meaning |
|---|---|
| `{"ok":true,"build":B}`, B = the repo's build | Healthy, running the committed code |
| `{"ok":true,"build":B}`, B ≠ the repo's build | `Code.js` changed but wasn't redeployed (google-setup.md §11) |
| HTML (a Google sign-in or *Authorization is required* page) | The script's authorization lapsed: google-setup.md §9 |
| Anything else, or a timeout | Apps Script is down or the URL is wrong |

**The repo's build** is line 3 of the committed `app/apps-script/Code.js`: `// build: <12 hex>`
(`sed -n 's#^// build: ##p' app/apps-script/Code.js`). `npm run gas:build` prints it, `bundle.test.ts` pins it, and
`whoami` returns it too (`{ok, me, build}`, for the app's sync screen). It is the first 12 hex characters of SHA-256
over the bundle, so any code change changes it.

**The monitor** (CI, WS3): a scheduled GitHub workflow runs the probe against the `GAS_URL` repo variable (a few times
a day) and fails, so GitHub e-mails the owner, unless the reply is JSON with `ok:true` and `build` equal to the repo's
build. A health probe is not a secret: the URL isn't one either (google-setup.md §4).

**Redeploying** is always google-setup.md §11 (new *version* on the existing deployment, never a new deployment),
then the probe must show the new build.

## 6. Backups
The sheet is the only copy of buys from the wallet, menu edits, goals and きろく edits (health numbers can be re-sent from the phones,
shortcut-health-sync.md §6). Google keeps version history (File → Version history), which protects against bad edits
but not against losing the file or the account. So, in addition:

**Weekly copy (set up once, ~5 min).** A separate *standalone* script, so the web app keeps its
current-sheet-only scope:
1. [script.google.com](https://script.google.com) → **New project**, name it *Island Fund backup*.
2. Paste:
   ```js
   const SHEET_ID = '…';            // from the sheet's URL: /spreadsheets/d/<SHEET_ID>/edit
   const FOLDER_NAME = 'Island Fund backups';
   const KEEP = 12;                 // weekly copies to keep (~3 months)

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
3. Select `backup` → **Run** once and allow Drive access (this script's own consent; the web app is unaffected).
   A copy appears in *Island Fund backups*.
4. **Triggers** (clock icon) → **Add trigger** → `backup`, *Time-driven*, *Week timer*, Monday, 4–5 am.
   Google e-mails the owner when a run fails.

**Off-Google copy:** File → Download → `.xlsx` once a month (or download the newest weekly copy), kept in the shared
password manager's file storage or another private place.

**Restore:** open the copy (or a version from Version history), check it, then either copy its rows back into the
live tabs (values only, ⌘⇧V), or make the copy the live sheet: open it → Extensions → Apps Script (a copy carries the
bound script; paste the current `Code.js` if in doubt), check `KEY_A`/`KEY_B` in Script Properties (google-setup.md
§3), deploy, and update `GAS_URL` (§1 step 2) and both Shortcuts: a different sheet means a new `/exec` URL.
Either way run `resync` in the script editor afterwards, so both phones drop their caches and refetch everything
(sheets-architecture.md §2.1).

## 7. Official art
Official *Animal Crossing: New Horizons* art (Nookipedia) in `app/static/art/`; the decision, the public-repo
trade-off and the fallback are [ADR 0018](../decisions/0018-official-art-public-site.md). Refresh: edit `SPECS` in
`app/scripts/fetch-assets.ts`, `npm run assets:fetch` (needs `cwebp`).

## 8. Troubleshooting
| Symptom | Check |
|---|---|
| Site says 「まだ設定されていません」 | `GAS_URL` repo variable missing; set it and re-run the workflow |
| App says it can't reach the island | The §5 probe. HTML instead of JSON → authorization lapsed (google-setup.md §9) |
| A row fixed or deleted by hand doesn't show on a phone | Run `resync` in the script editor (sheets-architecture.md §2.1); the phone refetches on its next sync |
| `{"ok":false,"error":"unauthorized"}` | Wrong or rotated key: re-paste it (app) / fix the `key` field (Shortcut) |
| `busy` | Another write held the lock for 10 s; the app retries by itself, the Shortcut runs again next time |
| `too_large` | Body over 1 MB: send the baseline in chunks of a few weeks |
| Numbers didn't move | The `uploads` tab (or `{"key":"…","action":"uploads"}`) shows each Shortcut run: status, warnings and the body's shape (each field's type, line count and first line). Synced metrics only go up (a lower re-send is ignored); a きろく edit can lower a day in an open week |
| Changes made offline | They stay queued on the phone and are sent when it's back online (the sync pill shows it) |

## 9. One-off cleanup after ADR 0021 (run once, then remove)
ADR 0021 left rows of past designs in the sheet: check-ins, 「筋トレでしたか？」 answers (`confirm`), the yen economy's
`approve` / `transfer` / `transfer_undo`, unused `pref`s (e.g. `share`, the two pots' `treatMenu` / `tripMenu`), every
`spend` and `spend_void` (ADR 0022: the wallet starts clean from earnings), presence `leave` rows, and every lower
metrics re-send. The app no longer reads or accepts any of them. `cleanupLegacyData` deletes them in one go
(user decision 2026-10-30: we're still developing).

1. **Back up first:** open the sheet → **File → Make a copy** (name it e.g. *Island Fund before cleanup*).
2. Make sure the deployed web app runs the build with `cleanupLegacyData` (the build in the commit that added it, or
   later): paste `app/apps-script/Code.js` into the editor and deploy (google-setup.md §11) if not.
3. In the sheet: **Extensions → Apps Script**. In the toolbar's function dropdown pick **`cleanupLegacyData`** →
   **Run**. Authorise if asked (the same current-sheet-only scope as the web app).
4. Read the log (**Execution log** opens below): `cleanupLegacyData: {"events":{"before":…,"after":…},"presence":…,
   "metrics":…,"uploads":…,"rev":"…"}`. Under the script lock it:
   - **events**: keeps only rows the script would accept today (`harvest`, `highfive`, `pref` with a key the app reads,
     `metric_set`, `workout_edit`, `workout_add`) and deletes **every** `spend` and `spend_void`, so run it right after
     deploying, before anyone buys from the new wallet;
   - **presence**: keeps `arrive` rows;
   - **metrics**: per person, date and metric keeps the rows the app reads (the highest value, the highest at the
     week's Wednesday lock and around each `metric_set`; for weight the latest row), each with its original `at`;
   - **uploads**: keeps the last 50;
   - bumps `REV` (both phones drop their caches and refetch everything on their next sync) and records the new row
     counts, so the next write isn't taken for a hand edit.
   Running it twice is harmless (the second run only bumps `REV`). `busy` = a phone was writing: run it again.
5. Open the app on both phones: the earnings are the same as before; the wallet holds everything earned (no buys yet).
6. **Afterwards remove it** from the code: the `cleanupLegacyData` section at the end of `app/gas/main.ts`, its footer
   function in `app/gas/build.ts`, its tests (`gas/main.test.ts`, `gas/bundle.test.ts`) and this section; then
   `npm run gas:build` and redeploy.
