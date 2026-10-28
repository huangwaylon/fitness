# Getting rid of the Mac: summary and recommendation (lead)

Round 1 (2026-10-28): [Google Apps Script + Sheets](google-apps-script.md) · [Cloudflare Workers + D1](cloudflare-workers.md) · [other free options](other-options.md) · [minimal backend / compute-on-read](minimal-backend.md).
Round 2 (2026-10-29): [client-direct BaaS: Supabase, Firebase](round2-baas.md) · [serverless hosts + private-repo UI hosting](round2-hosts.md) · [no-code stores, glue and push](round2-glue-and-push.md).

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

## Round 2 additions
- **The UI needs a new home once the repo is private** (GitHub Pages on the free plan needs a public repo). A **Cloudflare Worker can serve the static UI for free** (static-asset requests are free and unlimited) together with the API, on one origin: no CORS, one vendor, deployed from GitHub Actions. Any move off Pages changes the PWA's address: both phones reinstall once and paste their token again.
- **Supabase direct** (tested on real PostgREST + Postgres): three Postgres functions hold the logic. The Shortcut adds an `apikey` header and moves its token into the body. It pauses after 7 days with no API traffic, and the UI would need another host (e.g. Firebase Hosting). About 2 days.
- **Firebase Spark** (tested on the emulators, rules 12/12): no card, and Firebase Hosting solves private-repo UI hosting. But the Shortcut needs two calls, the SDK adds 68 KB gzipped, and there's no push without the paid plan. About 3 days.
- **Deno Deploy** (spike tested): app + KV + cron in one place, 1M requests/month. The new platform's cron is UTC-only, and card and private-repo support are unconfirmed. Runner-up host.
- **Ruled out:** Netlify (hard cap of about 20 deploys/month, then everything pauses), Vercel (daily cron), Val Town (public code only), Appwrite (pauses without console logins), PocketHost (paid), Airtable and JSONBin (quotas), Notion (no browser access), Pipedream (development-only free tier), no-backend iCloud/Notes tricks.
- **Push:** a local iOS Shortcuts reminder is the free default. **LINE Messaging API** (200 free messages/month in Japan, we'd use about 70) or ntfy.sh can add remote notifications, but something still has to trigger them (e.g. a cron).

## Recommendation (updated after round 2)
**One Cloudflare Worker serving both the UI and the API, with D1 as the database and cron for settlement.** It's the only option tested end to end in its real runtime. It keeps the current API, and the Shortcut changes only its URL. Push and on-time settlement keep working. It also hosts the UI for free from a private repo. All of this runs on the free plan at `*.workers.dev` (no domain). One-time cost: both phones reinstall the PWA from the new address.

**Runners-up:** Apps Script + Sheets, if the data should stay in your Google account (slower, no push, Shortcut change). Supabase or Deno Deploy, if you'd rather avoid Cloudflare.

**Follow-up:** whichever host we choose, move scoring to compute-on-read. The backend then shrinks to ingest + store + read, and the ledger and scheduler code go away.
