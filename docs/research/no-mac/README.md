# Getting rid of the Mac: summary and recommendation (lead)

Four parallel investigations (2026-10-28), each with sources and local tests: [Google Apps Script + Sheets](google-apps-script.md) · [Cloudflare Workers + D1](cloudflare-workers.md) · [other free options](other-options.md) · [minimal backend / compute-on-read](minimal-backend.md).

## Findings
- **Every tunnel (ngrok, Cloudflare Tunnel, Funnel) still needs an always-on machine.** Removing the Mac means moving the API to a free host.
- **The app needs very little backend.** Two append-only logs (Shortcut uploads, user events) plus three endpoints are enough; scoring is pure TypeScript and can run in the browser. Verified: 16/16 identical results on the real data, and 0 differences over a 340-checkpoint simulation. One rule to keep: pay each week the higher of its Sunday-19:30 and Wednesday-04:00 value, which needs host timestamps.
- **Notifications without a server work:** an iOS Shortcuts "Time of Day" automation can show a local notification (Apple docs).

| | **Cloudflare Workers + D1** | **Apps Script + Sheets** | Supabase free | GitHub only (Actions) |
|---|---|---|---|---|
| Cost | ¥0 (100k req/day, D1 5 GB) | ¥0 (Google quotas) | ¥0 (pauses after 7 idle days) | ¥0 |
| Tested here | **Yes:** full spike in the real runtime | Logic with mocks; real web apps' redirect + CORS | Docs only | Docs only |
| Shortcut change | **URL only** | Token into body, `text/plain`, URL | URL + key | GitHub API call |
| Web push | **Yes** (WebCrypto library verified) | No (local Shortcut reminder) | Yes | Yes (Actions) |
| Latency / timing | Fast; cron on time | 1–4 s; triggers ±1 h | Fast | Up to ~1 h lag |
| Port effort | 1–2 days (sync SQLite → async D1; scoring unchanged) | 2.5–3 days (rewrite in Apps Script) | 2–3 days | 2–3 days |
| Data lives at | Cloudflare | Google account | Supabase (AWS) | Private GitHub repo |

## Recommendation
**Cloudflare Workers + D1, with the UI staying on GitHub Pages.** It's the only option tested end to end in its real runtime, it keeps the current API, the Shortcut changes only its URL, nobody re-pairs, and push notifications and on-time settlement keep working, all on the free plan with a `*.workers.dev` URL (no domain).

**Runner-up:** Apps Script + Sheets, if you'd rather keep everything in a Google account and can live without push and with slower responses.

**Follow-up:** whichever host we choose, move scoring to compute-on-read. The backend then shrinks to ingest + store + read, and the ledger and scheduler code go away.
