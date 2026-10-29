# No Mac, round 2: serverless hosts other than Workers, and UI hosting for a private repo
Survey, 2026-10-29. **[V]** = verified (official page fetched in this round, or tested here). **[U]** = unverified. Blocked or unreachable: neon.com (proxy refused; neon.tech only redirects there). Spike: `/tmp/nomac2-hosts/` (not committed).

## Backends
| | **Deno Deploy** (new platform) | **Val Town Free** | **Netlify Free** (credits) | **Vercel Hobby** + store |
|---|---|---|---|---|
| Requests | 1M/month [V] | 100k runs/day [V] | 2 credits per 10k [V] | 1M invocations/month [V] |
| CPU / time | 10 h active CPU/month; 512 MB [V] | 1 min wall per run [V] | 60 s sync limit, 1 GB; compute 10 credits/GB-h [V] | 4 h active CPU/month [V] |
| Storage | Deno KV 1 GiB, 1M reads / 500k writes per month [V] | SQLite **10 MB** per val [V]; blob [U] | Netlify Blobs (eventually consistent unless `strong`) [V]; size cap [U] | Upstash Redis 250 MB, 500k cmds/month [V] · Turso 5 GB, no card [V] · Neon [U, blocked] |
| Cron | `Deno.cron`, **UTC**, 1-min schedules shown, 10 jobs/revision [V] | every **15 min** minimum [V] | scheduled functions, **UTC**, `@hourly` documented, 30 s limit [V] | **once a day, ±59 min** [V] |
| Card? | [U] | [U] | no paid option on Free (hard cap) [V]; card at signup [U] | no for Turso [V]; Vercel [U] |
| URL | `*.deno.net` [U]; 5 custom domains [V] | `*.val.run` [U]; no custom domains [V] | `*.netlify.app` [U] | `*.vercel.app` [U] |
| Gotchas | Classic shut down 2026-07-20; KV data not auto-migrated [V] | Free lists only *public* vals; private vals are a Pro feature (2,000) [V]. Source would be public; secrets go in env vars [U] | Hard cap: **all projects paused** with "Site not available" when credits run out [V]. **Each production deploy costs 15 credits**, so 300/month is about 20 deploys [V] | Two vendors; Hobby is non-commercial only (fine here) [V] |

**Cold starts:** typically well under a second [U]; none sleep like Render, so the Shortcut won't time out.

**Shortcut POST:** all four accept arbitrary headers, so `Authorization: Bearer` and the JSON body work unchanged, and only the URL changes [V for Deno in the spike; U for the others].

**PWA reads:** the CORS headers come from our own code on every host, as tested below.

**Web push:** ES256 VAPID signing with WebCrypto is [V] in Deno. Netlify and Vercel can run the current `web-push` as-is [U]. On Vercel Hobby, a once-a-day ±1 h cron is too coarse for a 20:00 reminder.

### Port effort
- **As-is SvelteKit:** `adapter-netlify` and `adapter-vercel` exist, but `better-sqlite3` writes to a local file and serverless hosts don't keep one. The DB layer has to move to an async driver anyway: drizzle + libsql (Turso) keeps the SQLite schema, which is the same sync-to-async work as D1. Estimate 1–2 days, same as Workers [U].
- **Minimal store API** (`ingest`, `events`, `state`, from [minimal-backend.md](minimal-backend.md)): about 80 lines on any of these hosts, about half a day. Deno KV fits it directly: append keys, prefix-list after a cursor, and `atomic().check()` for idempotent events.

### Spike [V] (Deno 2.9.6, `Deno.openKv` local SQLite backend, `Deno.cron`)
`main.ts` is one fetch handler with KV-backed `POST /ingest/shortcut/:person`, `POST /event` and `GET /state?since=`. Tested in-process (the sandbox blocks curl to localhost).
- **Ingest:** the user's body (`dates`/`steps`/`exercise_minutes` as newline text) returned 200 with 2 days parsed (855 steps, 0 minutes).
- **Auth:** wrong person → 403; missing or bad token → 401.
- **Idempotency:** the same event `id` sent twice → `duplicate:true` on the second.
- **CORS:** preflight from `huangwaylon.github.io` → 204 with ACAO; any other origin → 403.
- **Cursor:** `state` returned 1 ingest and 1 event; `?since=<cursor>` returned none.
- **Push:** WebCrypto P-256 signing produced a valid 3-part ES256 JWT.
- **Gotcha [V]:** Deno.cron rejects day-of-week `0`. Use `SUN` or `7`. Sunday 19:30 JST is `30 10 * * SUN` (UTC).

Netlify and Vercel CLIs weren't tried (they need a login).

## UI hosting with a private repo
| Host | ¥0? | Private GitHub repo | Bandwidth / requests | Builds | Notes |
|---|---|---|---|---|---|
| GitHub Pages | **No.** On GitHub Free "the repository must be public" [V]; private needs a paid plan (Pro) [U] | — | — | Actions | Site stays public even from a private repo [V] |
| **Cloudflare Workers static assets** | Yes. "Requests to static assets are free and unlimited" [V] | `wrangler deploy` from Actions, or the Workers & Pages GitHub app [V] | unlimited for assets [V]; 100k Worker req/day applies only to API calls [V] | Actions minutes (2,000/month private [V, round 1]) | Can serve the UI **and** the API from one Worker: same origin, no CORS |
| Cloudflare Pages | Yes [V] | GitHub app (repo selection) [V]; private support not stated on the page [U] | not stated [U] | 500/month [V] | A top-level `404.html` turns off SPA fallback [V]. Drop our `cp index.html 404.html` step there |
| Netlify | Yes, but deploys eat credits [V] | personal private repos yes [U]; private *organization* repos Pro only [V] | 20 credits/GB [V] | 15 credits per production deploy [V] | Our push-often habit would hit the cap and pause the API too |
| Vercel Hobby | Yes [V] | personal-account repos only, not org-owned [V] | 100 GB/month [V] | Git integration, or `vercel deploy --prebuilt` from Actions [V] | Non-commercial [V] |
| Firebase Hosting | Yes, no card [V] | `firebase deploy` from Actions with a token [U] (CLI is installed here) | 10 GB/month [V] (the pricing page says 360 MB/day); sites disabled until next month if exceeded [V] | Actions | Hosting only: Functions need Blaze [V] |
| Deno Deploy | Yes [V] | GitHub app; private not stated [U]; `deno deploy` CLI [V] | 20 GiB/month egress [V] | 15/hour [V] | "Static" runtime with SPA mode [V] |

**None of these need a custom domain** (default subdomains) [U].

**Base path:** `/fitness` exists only because GitHub Pages serves repos under a subpath. On any other host, build with `BASE_PATH=` (root) [U, not built here because `app/` was off limits], or upload the build into a `fitness/` folder.

**Moving the UI changes the PWA's origin.** Both users reinstall once, re-paste the token, and re-subscribe to push (ADR 0013).

## Recommendation
1. **Simplest ¥0 for a private repo: one Cloudflare Worker serving the static SPA plus the API**, deployed from Actions. It extends round 1's tested Workers + D1 spike: free UI, no CORS, one vendor.
2. **Runner-up: Deno Deploy (KV + cron + static SPA) on one platform.** The minimal store API ran here in the Deno runtime against local KV (the hosted KV wasn't tested). Card and private-repo details are unknown.
3. **Avoid:**
   - Netlify: the deploy-credit cap pauses everything.
   - Vercel Hobby: daily cron, and the database sits with a second vendor.
   - Val Town Free: public vals only, 10 MB SQLite, no UI hosting.
   - Firebase: hosting only.
