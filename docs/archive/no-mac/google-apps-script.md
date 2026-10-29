# No Mac: Google Sheets + Apps Script as the backend

**Verdict: feasible, free, and simpler to run than the Mac. Recommended, minus web push.** One Google Sheet holds the data; an Apps Script web app replaces the API. The SPA stays on GitHub Pages, and the Shortcut keeps POSTing. The costs: no web push, about 1–4 s per request, and the token has to move into the request body.

[V] = checked (docs, live request, or local test). [U] = not verified.

## How it works end to end
1. **Sheet** (owner: A's Google account, shared with B as Editor). Tabs: `daily` (date, person, steps, exercise_min), `checkins`, `ledger`, `raw`.
2. **Web app** (`Code.gs`, bound to the Sheet). Deployed with Execute as **Me** and access **Anyone**. Each phone has its own token in Script Properties (`TOKEN_A`/`TOKEN_B`). Every call is `POST https://script.google.com/macros/s/<ID>/exec` with a body like `{"action":"week","token":"…",…}`.
3. **Shortcut → ingest.** Apps Script stores the rows, and a day's numbers only ever go up (same rule as today).
4. **SPA → `fetch(url,{method:'POST',body:JSON.stringify(…)})`**, no headers (CORS simple request).
5. **Settlement.** An hourly trigger runs `settleIfDue()`. Once it's past Sunday 19:30 JST it settles the week, at most once.
6. **Reminder.** An iOS Shortcuts **Time of Day 20:00** automation shows a local notification (no push server).

## Validated
- [V] **Live Apps Script web apps** (public ones from GitHub, via curl). `/exec` answers **302 → `script.googleusercontent.com/macros/echo?...`**. Both the 302 and the final 200 carry **`Access-Control-Allow-Origin: *`**, and the final response is `application/json`. Round trips took **1.3–3.8 s**.
- [V] **CORS preflight doesn't work.** `OPTIONS` returns 200 `allow: HEAD, GET, POST` with **no ACAO header**. So the SPA must not send `Authorization` or `Content-Type: application/json`. Use a plain-text body.
- [V] **No request headers.** Per the docs, the event object only has `parameter(s)`, `queryString`, `pathInfo`, `postData.{contents,type,length}`. A bearer header can't be read, so the token goes in the body (or the query, GET only).
- [V, community] **Shortcuts → Apps Script `doPost`.** Several public projects POST JSON from **Get Contents of URL** to `/exec` and show the JSON reply in **Show Alert**, so the redirect gets followed. Community reports, not my own test (Reddit and Stack Overflow were blocked here).
- [V] **Prototype.** `/tmp/nomac-google/Code.gs` (ingest, week, check-in, token check, idempotent settlement, setup) plus `test.mjs`, which mocks SpreadsheetApp, ContentService, PropertiesService, LockService, Utilities and ScriptApp. **10/10 tests pass** (`node test.mjs`). It's not committed.
- [U] A real deployment, POST CORS on our own script, iOS 27 behaviour.

## Limits (consumer Gmail)
| Item | Limit | Our use | Source |
|---|---|---|---|
| Runtime per execution | 6 min | < 5 s | [quotas] |
| Trigger runtime | 90 min/day | 24 × ~2 s | [quotas] |
| Triggers | 20/user/script | 1 | [quotas] |
| Simultaneous executions | 30/user | 2 people | [quotas] |
| MailApp | 100 recipients/day | backup only | [quotas] |
| Time trigger precision | runs at a fixed random time within the hour ("9 AM → 9–10 AM") | settles 19:30–20:30 | [triggers] |
| Response status/headers | always 200, MIME type only | `ok` flag in JSON | [content] |

[quotas] developers.google.com/apps-script/guides/services/quotas · [triggers] …/guides/triggers/installable · [content] …/guides/content · web app event object …/guides/web

## Web push
[V] `Utilities` has HMAC and RSA signatures only, **no ECDSA/ES256**. VAPID needs ES256 (and payload push also needs ECDH plus AES-GCM). A pure-JS P-256 library bundled into the script might work [U]. Alternatives:
- **iOS Shortcuts Time-of-Day automation (recommended).** At 20:00, call `week` and show "まだチェックインしてないよ". Free, on-device.
- **MailApp email** (free).
- **ntfy.sh free tier.** [V] 250 messages/day, but the limit is **per IP**. Apps Script fetches come from shared Google IPs [U: shared-limit risk], and free topics are public. Not recommended.
- **LINE Notify** ended 2025-03-31 [U: host unreachable here].

## Google Form trick (rejected)
`entry.N=` POSTs to `/forms/d/e/<id>/formResponse` need no auth [U: undocumented]. But **anyone with the form ID can write**, and private read-back still needs Apps Script. Same web app, worse security.

## Privacy and risks
- Health totals live in A's Drive; B (Editor) sees everything. Google is the processor.
- **If the URL leaks without the token:** callers only get `unauthorized`, but they can burn executions (30 concurrent cap).
- **If a token leaks:** that person's reads and writes are exposed. Rotate the token in Script Properties, no redeploy needed.
- Gotchas:
  - Set `appsscript.json` `"timeZone":"Asia/Tokyo"`.
  - Sheets turns `2026-10-28` into a Date unless the column is plain text.
  - **A new deployment gets a new URL.** Edit the existing deployment and pick "New version" instead.

## Deploy steps (needs the user's Google login)
1. sheets.new → Extensions → Apps Script → paste `Code.gs`. In Project Settings, set the time zone to Asia/Tokyo and add Script properties `TOKEN_A` and `TOKEN_B` (`openssl rand -hex 24`).
2. Run `setup` once and authorize.
3. Deploy → New deployment → Web app, Execute as **Me**, access **Anyone** → copy the `/exec` URL.
4. Test: `curl -L "<url>?token=$TOKEN_A"`.

**With clasp 3.x:** `npm i -g @google/clasp && clasp login`, enable the API at script.google.com/home/usersettings, then `clasp create-script --type sheets --title "Island Fund"`, `clasp push`, `clasp create-deployment --description v1`. For later updates: `clasp push && clasp create-deployment --deploymentId <id>` (keeps the URL) [U: not run].

## Shortcut changes
- Step 13: URL `https://script.google.com/macros/s/<ID>/exec`, Method POST. **Delete the Authorization header.** Set Request Body to **JSON** with `action`=`ingest`, `token`=Token, `dates`, `steps`, `exercise_minutes` (newline lists; dates via Format Date `yyyy-MM-dd`).
- Step 14 is unchanged (it checks `ok`).

## Build effort
| Task | Estimate |
|---|---|
| Port the ~10 endpoints (purse spend/approve, transfer, prefs, check-in, week) to `Code.gs` | 1–1.5 d |
| Bundle `app/src/lib/scoring` (pure TS) into the script with esbuild (IIFE) for settlement, or score in the SPA [U] | 0.5 d |
| SPA client: one POST helper, token in localStorage, no push | 0.5 d |
| Shortcut edits + 20:00 reminder | 30 min/phone |
| **Total** | **~2.5–3 days**, then no server to babysit |
