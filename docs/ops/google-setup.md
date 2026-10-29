# Google setup: the Island Fund sheet and its Apps Script web app

One-time setup for ADR 0015. Result: a spreadsheet *Island Fund* plus a script bound to it, deployed as a web app
that both phones and the Shortcut talk to. About 20 minutes. Contract: [sheets-architecture.md](../design/sheets-architecture.md).

Use the **same Google account as the shared-finances app** (ADR 0015). Sign in to it in its own browser profile:
Google's consoles quietly act as the wrong account when several are signed in.

**Order** (the full path is [runbook §1](runbook.md#1-one-time-setup-the-canonical-order-the-other-docs-link-here)): §1–5 here → `GAS_URL` →
[shortcut-health-sync.md](shortcut-health-sync.md) (§6 below is the short version) → §7 pairing → §8 migration (before Sun 2026-11-08 19:30 JST) → §9 check on day 8.

## 1. Create the spreadsheet

1. Go to **sheets.new** and rename it **Island Fund**. Don't add tabs. The script creates `metrics`, `workouts`,
   `presence`, `events` and `uploads`, with headers, the first time it runs.
2. Sharing is optional. To look at the data by hand from your own accounts, **Share** with both addresses as
   **Viewer**, general access **Restricted**. Never choose *Anyone with the link*.
3. Don't edit or delete rows by hand. Every tab is append-only, and the app reads the history.

## 2. Create the bound script

1. In the sheet: **Extensions → Apps Script**. This creates a script *bound* to this spreadsheet. Rename the
   project **Island Fund web app**.
2. **Project Settings** (gear) → tick **Show "appsscript.json" manifest file in editor**.
3. Back in **Editor**:
   - Replace the contents of `Code.gs` with all of [`app/apps-script/Code.js`](../../app/apps-script/Code.js).
     It is a generated bundle; rebuild it with `cd app && npm run gas:build`, never edit it by hand.
   - Replace `appsscript.json` with [`app/apps-script/appsscript.json`](../../app/apps-script/appsscript.json). It sets
     one scope, `spreadsheets.currentonly` (this one spreadsheet only), the web app settings (run as you, anyone may
     call it) and the time zone `Asia/Tokyo`.
   - Save (⌘S).

   **Optional, with clasp** (instead of pasting). Don't use `clasp clone`, because it would overwrite the built
   file. Instead: `npx @google/clasp login`, then create `app/apps-script/.clasp.json` (gitignored) containing
   `{"scriptId":"<Script ID from Project Settings>","rootDir":"."}`, and run `npx @google/clasp push` from
   `app/apps-script/`. It uploads `Code.js` and `appsscript.json` and replaces the editor's `Code.gs`.

## 3. The two keys

Generate one key per person, and keep both in the shared password manager:

```sh
openssl rand -hex 32   # → KEY_A (Waylon's phone + his Shortcut)
openssl rand -hex 32   # → KEY_B
```

**Project Settings → Script Properties → Add script property**, twice:

| Property | Value |
|---|---|
| `KEY_A` | first key |
| `KEY_B` | second key |

The script also creates a `LAST_AT` property itself. It keeps server timestamps strictly increasing. Leave it alone.

## 4. Deploy

1. **Deploy → New deployment** → gear → **Web app**.
2. Description `v1`. **Execute as: Me**. **Who has access: Anyone** (not "Anyone with a Google account": phones
   don't sign in to Google).
3. **Deploy** → **Authorize access** → pick the account → *Google hasn't verified this app* → **Advanced** →
   **Go to Island Fund web app (unsafe)** → **Allow**. The prompt should mention only "this spreadsheet". If it asks
   for all your spreadsheets, the manifest wasn't saved: fix it and deploy again.
4. Copy the **Web app URL** (ends in `/exec`). The app and the Shortcut use it. It isn't a secret (the keys are),
   but don't post it.

## 5. Verify with curl

The endpoint only answers POST. Opening it in a browser shows an error page, and that's expected. Keep the key out of
your shell history:

```sh
URL='https://script.google.com/macros/s/…/exec'
read -s KEY            # paste KEY_A, press Enter
post() { curl -sSL "$URL" -H 'Content-Type: text/plain;charset=utf-8' --data "$1"; echo; }

post "{\"key\":\"$KEY\",\"action\":\"whoami\"}"
# → {"ok":true,"me":"A"}    (and the five tabs now exist in the sheet)

post "{\"key\":\"$KEY\",\"action\":\"ingest\",\"dates\":\"Sep 28, 2026 at 7:11 AM\",\"steps\":\"855\",\"exercise_minutes\":\"0\"}"
# → {"ok":true,"metrics":2,"workouts":0}; run it again → "metrics":0 (higher-only, idempotent)

post '{"key":"wrong","action":"whoami"}'
# → {"ok":false,"error":"unauthorized"}
```

Leave out `-X POST`: `/exec` replies with a 302 that has to be followed as a GET, and `-L --data` does exactly
that. If you get back HTML instead of JSON, see §9.

(The test `ingest` above writes real rows for 2026-09-28. They match the migrated values, so they're harmless.)

## 6. Point the Shortcut at it (sheets-architecture.md §5)

In **しまの同期**, keep the existing dictionary (`dates`, `steps`, `exercise_minutes`, …) and add two fields:
`key` = your key, `action` = `ingest`. In **Get Contents of URL**, set the URL to the `/exec` URL, Method **POST**,
Request Body **JSON** (or **Text** containing the JSON), and **delete the `Authorization` header**. Run it once. The
result should be `{"ok":true,…}`. Each row also leaves an audit line in the `uploads` tab (status, size, no payload).

Limits: 1 MB per request (an 84-day raw-sample baseline can go over: send it in chunks of a few weeks) and
120 requests per key per minute.

## 7. Pairing the phones

On each iPhone, **Add to Home Screen first** (Safari → Share → Add to Home Screen), open the app from the icon, and paste
that person's key. `whoami` confirms who it is. A `…/#key=<key>` link only works when opened inside the installed
app: iOS keeps a separate storage for the Home Screen app, so a key saved in Safari isn't seen there.

## 8. Migrate the Mac data (once)

The Shortcut moved to the sheet in §6, so the Mac receives nothing new: export now.

1. `cd app && npm run export:sheet` (plain Node ≥ 24, built-in `node:sqlite`) reads `data/island.db` **read-only**
   (or `DATABASE_PATH=…`) and writes header-less TSVs to `app/data/export/` (gitignored): `metrics.tsv`,
   `workouts.tsv`, `presence.tsv`, `events.tsv`. It prints the row counts and the column order. Ledger entries
   aren't exported (the app recomputes payouts); it warns if there were manual `adjust` entries.
2. For each file with rows: open it in a text editor, select all, copy. In the sheet, click the first empty cell in
   column A of the matching tab (A2 on a fresh tab), and paste with **⌘⇧V** (values only). The text columns are
   preformatted as plain text, so dates stay text. The script also copes if Sheets turned some into dates anyway.
3. Rows already sent by the Shortcut to the sheet are fine: metrics are read as "highest value per day" and workouts
   by id (workout ids are the same SHA-256 keys the Mac used), so overlaps change nothing.
4. Compare the jar with what the Mac showed, then retire the Mac: [runbook §5](runbook.md#5-migrating-from-the-mac-once).

## 9. Does it need the shared-finances Cloud project or a published consent screen?

**No, as far as we know. Don't attach a Cloud project.** Shared finances needed a standard Cloud project only
because it hands out tokens for the **Sheets REST API**, and that API must be enabled in a project. This script uses
the built-in `SpreadsheetApp` service, which works with the script's default (hidden) Cloud project. The 7-day
expiry that shared-finances SETUP.md warns about comes from a *standard* project whose OAuth consent screen is
left in **Testing**. A default project has no consent screen for you to leave in Testing. Attaching the
shared-finances project would also tie the Island script to that project's consent settings for no gain.

We couldn't test this beyond doubt from here, so here is how to spot the symptom. About a week after setup,
requests stop returning JSON: curl (§5) gets an HTML page (*Authorization is required* / a Google sign-in page),
and the app reports the server as unreachable. Check once, on day 8 or later, with the `whoami` curl. If it fails:

- **Fix now:** open the script editor, select `doPost` in the function menu and click **Run**. It returns a
  harmless `bad_request`, but the run makes Google ask for authorization again. Then try `whoami` again.
- **Fix for good:** attach a standard Cloud project with a **published** consent screen (shared-finances SETUP.md
  §4–5 shows the steps). Reusing the `shared-finances` project is fine, since it's already published. Then redeploy
  (§11).

## 10. Rotating a key

Do it if a phone is lost, or a key leaks, or at any doubt. Generate a new one with `openssl rand -hex 32`, then
**Project Settings → Script Properties** → edit `KEY_A` (or `KEY_B`) → **Save**. It takes effect on the next
request, with no redeploy. Then paste the new key into that person's app and Shortcut. The old key stops working
at once. Rows already written stay, since they are tagged with the person, not the key.

## 11. Updating the code (keeps the same URL)

After changing `app/gas/**` or the parser: `cd app && npm run gas:build`, commit, paste the new `Code.js` (or
`clasp push`). Saving the editor doesn't change what the deployment runs, because a deployment is pinned to a
version. Go to **Deploy → Manage deployments** → pencil on the existing deployment → **Version: New version** →
**Deploy**. **Don't** use *New deployment*: that creates a second, different `/exec` URL, and the phones and the
Shortcut would keep calling the old one.
