# 0015 — Google Sheet as the database; Apps Script as the only backend; no Mac
**Status:** Accepted (user decision, 2026-10-29). Supersedes the hosting/backend parts of 0005, 0010, 0012 (endpoint) and 0013 (API on the Mac). Notifications dropped by [0016](0016-no-privacy-no-alerts.md). Research: [`docs/research/no-mac/`](../research/no-mac/).

**User input:** "Let's go with the Sheet approach." Use **the same Google account as the shared-finances app**; the user creates resources as needed.

## Decision
- **Data:** one new spreadsheet, *Island Fund*, owned by the shared Google account (sharing it with both people is optional, for hand inspection).
- **Backend:** an Apps Script **bound to that spreadsheet**, scope **`spreadsheets.currentonly`**, deployed as a web app (*Execute as: Me*, *Anyone*). It is the only reader and writer of the sheet. **It never hands out Google tokens.** Keeping the account's existing token-minter (shared finances) the only broad credential means a leaked Island key can reach Island data only.
- **Auth:** two per-person keys (`KEY_A`, `KEY_B`, 32 random bytes hex) in Script Properties. A key identifies the person. Keys go in the **request body**, never the URL. Rotating a key = editing a property.
- **Transport:** `POST` with `Content-Type: text/plain` (a simple request, no CORS preflight). Apps Script answers through its 302 to `script.googleusercontent.com`, with `Access-Control-Allow-Origin: *` (verified in research).
- **Scoring moves into the app (compute-on-read).** The sheet holds raw rows only. The PWA computes scores, yen, harvest and jar with the existing pure scoring code. Each week pays **max(value as of Sunday 19:30 JST, value as of Wednesday 04:00 JST)**, using the **server timestamps** the script writes on every row. That reproduces the old earn + top-up ledger with no ledger and no scheduler.
- **Speed:** the app paints instantly from a local snapshot and refreshes in the background (incremental: rows since the last server timestamp seen). Taps are optimistic, writes queue and retry, and 1–4 s Apps Script latency is never on the critical path.
- **Notifications:** none (ADR 0016).
- **UI hosting:** unchanged for now (GitHub Pages, static SPA). If the repo goes private, the static build moves to another free static host.
- **Removed:** the Node server, SQLite/drizzle, Funnel, the scheduler, pairing codes, web push, the Docker setup.

## Accepted risk
The shared account's existing token-minter (shared finances) issues tokens with the `spreadsheets` scope. Those can also read and write the Island sheet. Both keys belong to the same two people on their own phones. The shared-finances repo is not modified.

Architecture contract: `docs/design/sheets-architecture.md`.
