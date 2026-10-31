# Google setup (first time)

Result: a Google Sheet *Island Fund*, an Apps Script bound to it and deployed as a web app (the `/exec` URL), the
Pages site pointed at it, the Shortcuts sending health data, and both phones paired. About 30 minutes. How the
backend works: [backend.md](../backend.md).

Use one Google account for everything, signed in alone in its own browser profile (Google's consoles quietly act as
the wrong account when several are signed in).

## 1. Create the spreadsheet
1. Open **sheets.new** and rename it **Island Fund**. Don't add tabs: the script creates them with headers the
   first time it runs (step 5):

   | Tab | Columns | Written by |
   |---|---|---|
   | `metrics` | `at, person, date, metric, value` (`steps`, `exercise_min`, `move_kcal`, `stand_min`, `weight`) | `ingest` (the Shortcut) |
   | `events` | `at, person, id, type, data` (buys, prefs, harvests, high-fives, きろく edits) | `event` (the app) |
   | `uploads` | `at, person, status, bytes, error` (one audit row per `ingest`) | `ingest` |

2. Sharing is optional: to read the data from your own accounts, **Share** them as **Viewer**, general access
   **Restricted**. Never *Anyone with the link*.

## 2. Create the bound script
1. In the sheet: **Extensions → Apps Script**. Rename the project **Island Fund web app**.
2. **Project Settings** (gear) → tick **Show "appsscript.json" manifest file in editor**.
3. In **Editor**:
   - Replace `Code.gs` with all of [`app/apps-script/Code.js`](../../app/apps-script/Code.js) (a generated bundle:
     rebuild it with `cd app && npm run gas:build`, never edit it by hand).
   - Replace `appsscript.json` with [`app/apps-script/appsscript.json`](../../app/apps-script/appsscript.json): one
     scope (`spreadsheets.currentonly`), run as the deployer, anyone may call, time zone `Asia/Tokyo`.
   - Save (⌘S).

Optional, with clasp instead of pasting (not `clasp clone`, which overwrites the built file): `npx @google/clasp login`,
create `app/apps-script/.clasp.json` (gitignored) with `{"scriptId":"<Script ID from Project Settings>","rootDir":"."}`,
then `npx @google/clasp push` from `app/apps-script/`.

## 3. Add the two keys
```sh
openssl rand -hex 32   # KEY_A (Waylon: his phone and his Shortcut)
openssl rand -hex 32   # KEY_B
```
Keep both in the shared password manager. **Project Settings → Script Properties → Add script property**: `KEY_A`
and `KEY_B`. A key must be 32–128 hex characters.

The script adds `LAST_AT`, `ROWS` and `REV` itself. Leave them alone (`REV`: [runbook §5](runbook.md#5-resync-rev)).

## 4. Deploy the web app
1. **Deploy → New deployment** → gear → **Web app**.
2. Description `v1`, **Execute as: Me**, **Who has access: Anyone** (not "Anyone with a Google account": the phones
   don't sign in to Google).
3. **Deploy → Authorize access** → the account → *Google hasn't verified this app* → **Advanced** → **Go to Island
   Fund web app (unsafe)** → **Allow**. The prompt should mention only "this spreadsheet"; if it asks for all your
   spreadsheets, the manifest wasn't saved: fix it and deploy again.
4. Copy the **Web app URL** (`https://script.google.com/macros/s/…/exec`). It isn't a secret (the keys are), but
   don't post it.

This is the only time you use *New deployment*. Every later code change is a new version of this deployment
([runbook §2](runbook.md#2-redeploy-the-apps-script)), so the URL never changes.

## 5. Verify with curl
`/exec` answers POST only (a browser shows an error page). Don't use `-X POST`: `/exec` redirects, and `-L --data`
follows it correctly. Keep the key out of shell history:

```sh
URL='https://script.google.com/macros/s/…/exec'
read -s KEY            # paste KEY_A, Enter
post() { curl -sSL "$URL" -H 'Content-Type: text/plain;charset=utf-8' --data "$1"; echo; }

post '{"action":"health"}'
# → {"ok":true,"build":"<12 hex>"}             (no key needed)
post "{\"key\":\"$KEY\",\"action\":\"whoami\"}"
# → {"ok":true,"me":"A","build":"<12 hex>"}    (the three tabs now exist)
post '{"key":"wrong","action":"whoami"}'
# → {"ok":false,"error":"unauthorized"}
```

HTML instead of JSON: see §9.

## 6. Point the site at it
```sh
gh variable set GAS_URL --body 'https://script.google.com/macros/s/…/exec'
```
Then re-run the *Deploy UI to GitHub Pages* workflow (Actions tab, or `gh workflow run pages.yml`). Until `GAS_URL`
is set, the site shows 「まだ設定されていません / Not set up yet」 (the demo at `?demo` still works). The *Backend
health* monitor starts running once the variable exists.

## 7. Set up the Shortcuts
On each phone, with that person's key: [shortcut-health-sync.md](shortcut-health-sync.md) §2–4, and optionally §5
(the 84-day baseline).

## 8. Pair the phones
On each iPhone: open https://huangwaylon.github.io/fitness/ in Safari → Share → **Add to Home Screen** *first*, open
the app from the icon, paste that person's key. iOS gives the Home Screen app its own storage, so a key entered in
Safari isn't seen there; a `…/fitness/#key=<key>` link works only when opened inside the installed app.

## 9. Day-8 authorization check
The script uses its default (hidden) Cloud project, which has no consent screen in *Testing*, so its authorization
shouldn't expire after 7 days. Don't attach a Cloud project. To be sure, on day 8 or later run the `whoami` curl
(§5). If it returns HTML (*Authorization is required* or a Google sign-in page):

- **Fix now:** in the script editor select `doPost` → **Run**. It returns a harmless `bad_request`, and Google asks
  for authorization again. Run `whoami` again.
- **Fix for good:** attach a standard Cloud project whose OAuth consent screen is **published**, then redeploy
  ([runbook §2](runbook.md#2-redeploy-the-apps-script)).
