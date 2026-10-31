# Runbook

Three pieces, no server of our own:
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
3. Paste the new `Code.js` into the script editor's `Code.gs` (or `npx @google/clasp push` from `app/apps-script/`) and save.
4. **Deploy → Manage deployments** → pencil on the existing deployment → **Version: New version** → **Deploy**.
   Saving alone changes nothing (a deployment is pinned to a version). **Never** *New deployment*: it makes a new
   `/exec` URL that nothing calls.
5. Check (§3): `health` must answer the new build.

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
The sheet is the only copy of buys, the menu and goal changes (health numbers come from Apple Health and can be re-sent:
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
`cd app && npm run assets:fetch` (needs `cwebp`: `brew install webp`).

## 9. Sheet leftovers
An older sheet may still hold:
- `gym_set`, `metric_set`, `workout_add` and `workout_edit` rows in `events` (e.g. B's one `metric_set`): not event
  types the app knows any more (Apple Health is the source of truth), so the model ignores them and the server refuses
  new ones. Harmless; leave them, or delete those rows by hand (that bumps `REV`, so each phone refetches once).
- `presence` and `workouts` tabs: nothing reads or writes them. Delete them by hand if you like (right-click the tab
  → **Delete**). Neither is a synced tab, so this doesn't change `REV` and needs no `resync`.
