# Google setup: the Island Fund sheet and its Apps Script web app

One-time setup for ADR 0015. Result: a spreadsheet *Island Fund* plus a script bound to it, deployed as a web app
that both phones and the Shortcut talk to. About 20 minutes. Contract: [sheets-architecture.md](../design/sheets-architecture.md).

Use the **same Google account as the shared-finances app** (ADR 0015). Sign in to it in its own browser profile:
Google's consoles quietly act as the wrong account when several are signed in.

**Order** (the full path is [runbook §1](runbook.md#1-one-time-setup-the-canonical-order-the-other-docs-link-here)): §1–5 here → `GAS_URL` →
[shortcut-health-sync.md](shortcut-health-sync.md) (§6 below is the short version) → §7 pairing → §9 check on day 8.

## 1. Create the spreadsheet

1. Go to **sheets.new** and rename it **Island Fund**. Don't add tabs. The script creates `metrics`, `events` and
   `uploads`, with headers, the first time it runs (§8).
2. Sharing is optional. To look at the data by hand from your own accounts, **Share** with both addresses as
   **Viewer**, general access **Restricted**. Never choose *Anyone with the link*.
3. Don't edit or delete rows by hand unless you must (then run `resync`, §3). Every tab is append-only, and the app
   reads the history.

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

The script also creates `LAST_AT` (keeps server timestamps strictly increasing), `ROWS` (each tab's last row as
the script left it) and `REV` (the data revision: it changes when rows are edited by hand, so the phones refetch
everything; sheets-architecture.md §2.1). Leave `LAST_AT` and `ROWS` alone. After fixing rows by hand, run `resync`
from the editor's function menu to be sure the phones pick it up.

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
# → {"ok":true,"me":"A","build":"<12 hex>"}    (and the three tabs now exist in the sheet)

post "{\"key\":\"$KEY\",\"action\":\"ingest\",\"dates\":\"Sep 28, 2026 at 7:11 AM\",\"steps\":\"855\",\"exercise_minutes\":\"0\"}"
# → {"ok":true,"metrics":2}; run it again → "metrics":0 (higher-only, idempotent)

post '{"key":"wrong","action":"whoami"}'
# → {"ok":false,"error":"unauthorized"}
```

Leave out `-X POST`: `/exec` replies with a 302 that has to be followed as a GET, and `-L --data` does exactly
that. If you get back HTML instead of JSON, see §9.

The test `ingest` above writes real rows for 2026-09-28 (before the economy starts, so they earn nothing).

## 6. Point the Shortcuts at it

Build the health-sync Shortcut with the `/exec` URL and each person's key:
[shortcut-health-sync.md](shortcut-health-sync.md) §2–4 (there is no gym automation any more: §5 there). Every `ingest` leaves an audit row in the `uploads` tab
(status, size, warnings and the body's shape; never the key).

## 7. Pairing the phones

On each iPhone, **Add to Home Screen first** (Safari → Share → Add to Home Screen), open the app from the icon, and paste
that person's key. `whoami` confirms who it is. A `…/#key=<key>` link only works when opened inside the installed
app: iOS keeps a separate storage for the Home Screen app, so a key saved in Safari isn't seen there.

## 8. The tabs

| Tab | Rows | Written by |
|---|---|---|
| `metrics` | `at, person, date, metric, value` (`steps`, `exercise_min`, `move_kcal`, `stand_min`, `weight`) | `ingest` |
| `events` | `at, person, id, type, data` (buys, menu and goal prefs, harvest taps, high-fives, きろく edits) | the app (`event`) |
| `uploads` | `at, person, status, bytes, error` (an audit line per `ingest`) | `ingest` |

An older sheet may still have `workouts` and `presence` tabs: nothing uses them any more, delete them by hand
(runbook §9). `at` is the server time (ISO UTC). The full contract: [sheets-architecture.md](../design/sheets-architecture.md).

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
**Project Settings → Script Properties** → edit `KEY_A` (or `KEY_B`) → **Save**. It takes effect within 5 minutes
(the script caches the keys), with no redeploy. Then paste the new key into that person's app and Shortcut. The old
key stops working within those 5 minutes. Rows already written stay, since they are tagged with the person, not the key.

## 11. Updating the code (keeps the same URL)

After changing `app/gas/**` or the parser: `cd app && npm run gas:build`, commit, paste the new `Code.js` (or
`clasp push`). Saving the editor doesn't change what the deployment runs, because a deployment is pinned to a
version. Go to **Deploy → Manage deployments** → pencil on the existing deployment → **Version: New version** →
**Deploy**. Then check the version: `post '{"action":"health"}'` (the §5 helper, no key needed) must answer the
`build` printed by `npm run gas:build` (runbook §5). **Don't** use *New deployment*: that creates a second, different `/exec` URL, and the phones and the
Shortcut would keep calling the old one.
