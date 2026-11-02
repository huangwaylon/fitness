# Google setup (the sheet's export)

Result: a Google Sheet *Island Fund* the relay's record is exported to (a read-only copy, a backup to look at), and
an Apps Script bound to it, deployed as a web app (the `/exec` URL) that takes the export. About 15 minutes. The app,
the Shortcuts and the pairing don't need any of this: they talk to the relay ([backend.md](../backend.md#the-record),
[runbook §10](runbook.md#10-deploy-the-live-relay)).

Use one Google account for everything, signed in alone in its own browser profile (Google's consoles quietly act as
the wrong account when several are signed in).

## 1. Create the spreadsheet
Open **sheets.new** and rename it **Island Fund**. Don't add tabs: the first export creates `README`, `metrics`,
`events` and `uploads` ([backend.md](../backend.md#tabs)). Sharing is optional: to read the data from your own
accounts, **Share** them as **Viewer**, general access **Restricted**. Never *Anyone with the link*.

## 2. Create the bound script
1. In the sheet: **Extensions → Apps Script**. Rename the project **Island Fund web app**.
2. **Project Settings** (gear) → tick **Show "appsscript.json" manifest file in editor**.
3. In **Editor**:
   - Replace `Code.gs` with all of [`app/apps-script/Code.js`](../../app/apps-script/Code.js) (a generated bundle:
     rebuild it with `cd app && npm run gas:build`, never edit it by hand).
   - Replace `appsscript.json` with [`app/apps-script/appsscript.json`](../../app/apps-script/appsscript.json): run as
     the deployer, anyone may call, time zone `Asia/Tokyo`, one scope: `spreadsheets.currentonly` (only this sheet).
   - Save (⌘S).

Optional, with clasp instead of pasting (not `clasp clone`, which overwrites the built file): `npx @google/clasp login`,
create `app/apps-script/.clasp.json` (gitignored) with `{"scriptId":"<Script ID from Project Settings>","rootDir":"."}`,
then `npx @google/clasp push` from `app/apps-script/`. Later redeploys: `npm run gas:deploy`
([runbook §2](runbook.md#2-redeploy-the-apps-script)).

## 3. Add the two keys
**Project Settings → Script Properties → Add script property**: `KEY_A` and `KEY_B`, the same two keys as the
relay's Worker secrets (in the shared password manager). The script uses them only to check the export's signature
(a secret derived from both, so only the relay can sign). Old properties `LAST_AT`, `ROWS`, `TAILS`, `REV` (from when
the sheet was the record) are unused and may be deleted.

## 4. Deploy the web app
1. **Deploy → New deployment** → gear → **Web app**.
2. Description `v1`, **Execute as: Me**, **Who has access: Anyone** (the relay doesn't sign in to Google; the
   signature is the auth).
3. **Deploy → Authorize access** → the account → *Google hasn't verified this app* → **Advanced** → **Go to Island
   Fund web app (unsafe)** → **Allow**. The prompt should mention only "this spreadsheet".
4. Copy the **Web app URL** (`https://script.google.com/macros/s/…/exec`) into `EXPORT_URL` in `relay/wrangler.toml`
   and deploy the relay ([runbook §10](runbook.md#10-deploy-the-live-relay)).

This is the only time you use *New deployment*. Every later code change is a new version of this deployment
([runbook §2](runbook.md#2-redeploy-the-apps-script)), so the URL never changes.

## 5. Check it
```sh
curl -sSL 'https://script.google.com/macros/s/…/exec' -H 'Content-Type: text/plain;charset=utf-8' --data '{"action":"health"}'
# → {"ok":true,"build":"<12 hex>"}
```
Then, from `relay/`, `KEY_A=… KEY_B=… node scripts/record.ts export` ([runbook §13](runbook.md#13-the-record)) →
`{"ok":true,"written":{…}}`, and the sheet's `README` shows the time.

## 6. Day-8 authorization check
The script uses its default (hidden) Cloud project, which has no consent screen in *Testing*, so its authorization
shouldn't expire after 7 days. Don't attach a Cloud project. To be sure, on day 8 or later run the health curl (§5).
If it returns HTML (*Authorization is required* or a Google sign-in page), the export stops (the README's time gets
old; the app is not affected):

- **Fix now:** in the script editor select `doPost` → **Run**. It returns a harmless `bad_request`, and Google asks
  for authorization again.
- **Fix for good:** attach a standard Cloud project whose OAuth consent screen is **published**, then redeploy
  ([runbook §2](runbook.md#2-redeploy-the-apps-script)).
