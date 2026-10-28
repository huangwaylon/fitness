# No-Mac backend: other free options (excluding Apps Script and Cloudflare Workers)
Survey, 2026-10-28. Need: Shortcut POSTs day totals with a secret, ~10 small endpoints, 2 users, 1 push/day, weekly settlement cron, PWA on GitHub Pages.
**[V]** = verified (official page fetched, or tested locally). **[U]** = unverified (known from memory or community reports; the page was blocked or didn't say).
**Blocked by the proxy (allowlists left alone):** firebase.google.com, val.town, deno.com, vercel.com, netlify.com, render.com, docs.oracle.com, turso.tech, upstash.com, ngrok.com. developer.apple.com only returned a JS shell.

## Comparison
| Option | ¥0 / card? | Shortcut push | PWA read | Cron | Web push | Effort | Main risk |
|---|---|---|---|---|---|---|---|
| **Supabase Free** | ¥0, no card [U] | `POST /rest/v1/rpc/ingest` with publishable key + per-user secret | supabase-js + RLS | pg_cron (+pg_net to call Edge Fn) [V] | Edge Function + `web-push` [U] | Medium (port SQLite schema to Postgres) | Pauses after 1 week of inactivity [V] |
| **GitHub-only** (private data repo + Actions) | ¥0, no card [V] | Contents API `PUT` new file with fine-grained PAT | GitHub API with read-only PAT (CORS `*`) [V] | Actions `schedule`, ≥5 min, can be late or dropped [V] | Actions job sends VAPID push [U] | Medium | Delays; PAT handling; 2,000 private minutes/month [V] |
| **Firebase Spark** | ¥0, no card [U] | 2 calls: Auth REST sign-in → Firestore REST write [U] | Firestore SDK + rules | None (Functions need Blaze) [U] | FCM free, but needs a sender [U] | Medium–high (scoring moves to client) | No server code: settlement and push need a hybrid |
| **Val Town free** | ¥0 [U] | HTTP val | HTTP val | Cron vals; free interval limited [U] | `web-push` in a val [U] | Low (TS/Hono, SQLite built in) | Small vendor; free quotas undocumented here |
| **Deno Deploy** | ¥0 [U] | HTTP | HTTP | `Deno.cron` [U] | yes [U] | Low–medium | Classic Deploy sunset; KV/cron on the new platform unclear [U] |
| **Vercel Hobby + Turso/Upstash** | ¥0 [U] | Function | Function | Hobby cron: daily only, ±1 h [U] | yes | Medium (2 vendors) | Hobby is non-commercial; DB on a second free tier |
| **Netlify free** | ¥0, credit cap [U] | Function | Function | Scheduled functions [U] | yes | Medium | Credit plan pauses the site at the cap [U]; needs a DB elsewhere |
| **Render free** | ¥0 [U] | Web service | Web service | No free cron [U] | yes | Low (runs the existing Node app) | Sleeps after ~15 min idle (cold start ~1 min, Shortcut may time out); no disk; free Postgres expires [U] |
| **Oracle Always Free VM** | ¥0, **card required** [U] | Existing app as-is | same | systemd timer | same | High (VM, TLS, patching) | Idle reclamation; ARM capacity errors; Oracle account lockouts [U] |
| **PocketBase on a free host** | Only Oracle is truly free (Fly.io free plan ended) [U] | — | — | — | — | High | Same as Oracle |
| **Tunnels** (ngrok, Cloudflare Tunnel, localtunnel, Funnel) | ¥0 | — | — | — | — | — | All need an always-on machine; iOS can't host a server |
| **CloudKit** | Needs the $99/yr Apple Developer Program [U] | Can't: server-to-server needs ECDSA request signing, which Shortcuts can't do | CloudKit JS with Apple ID sign-in | None | No | High | Cost; ¥0 rule broken |

## Notes per option
**1. Supabase.** Free: 2 active projects, 500 MB DB, 500k Edge Function calls/month, **paused after 1 week of inactivity** [V] ([pricing](https://supabase.com/pricing)). The page doesn't define "activity". Real API requests reportedly count [U]. Add a keep-alive ping to be safe. pg_cron is supported and can call Edge Functions through pg_net [V] ([docs](https://supabase.com/docs/guides/functions/schedule-functions)). The publishable/anon key is public. Security comes from grants plus RLS, and anon has no access until you grant it [V] ([RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)). **Shortcut design:** expose one `SECURITY DEFINER` function `ingest(secret text, payload jsonb)` to anon. It checks the hash of the secret against `devices` and upserts day totals, so the Shortcut sends `apikey: <publishable>` plus the secret in the body. Tables stay locked to anon, and the PWA uses Supabase Auth (magic link, or the same RPC pattern with a session token). Port: SQLite → Postgres. Scoring can be reused in Edge Functions (Deno TS).

**2. Firebase Spark.** Cloud Functions and Scheduler require Blaze (card) [U]. The Shortcut can call `identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=API_KEY` to get an `idToken`, then `PATCH` a Firestore REST document, and rules check `request.auth.uid` [U]. Scoring could run in the PWA, but settlement and push still need a server, e.g. an Actions cron. That makes it a hybrid. FCM itself is free, and iOS 16.4+ supports web push for installed PWAs [U].

**3–4. Val Town, Deno Deploy, Vercel, Netlify, Render, Oracle.** Pricing pages were blocked, so the table is from memory [U]. The things to check: Val Town's free cron interval and run caps, Deno Deploy Classic's sunset and KV/cron on the new platform, Vercel Hobby (daily cron, personal use only), Netlify's credit cap, Render's sleep with no disk, and Oracle's card, patching and idle reclaim.

**5. GitHub as the backend.** [V]: this repo and its Pages site are **public** (`gh api …/pages` → `public: true`). Private Pages needs Enterprise Cloud ([docs](https://docs.github.com/en/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site)), so **health data must not be committed here in plaintext**. Actions minutes: unlimited for public repos, 2,000/month for private repos on Free ([billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)) [V]. `schedule` runs at most every 5 min and may be delayed or dropped at busy times.; public-repo schedules turn off after 60 idle days ([events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)) [V]. The Pages workflow here takes ~35–40 s per run [V]. `api.github.com` answers CORS `*` for GET and PUT with `Authorization` [V], so the SPA can read a **private data repo** directly.
**Design:**
- A private repo `fitness-data`.
- Each Shortcut `PUT`s a new file `inbox/<person>/<ISO time>.json` with a fine-grained PAT (Contents: write on that repo only). New paths don't need a `sha`.
- An hourly Actions cron (~1 min a run, ~750 min/month) folds the inbox into `state.json` with the existing TS scoring code, runs Sunday settlement, and sends the daily Web Push.
- The PWA reads `state.json` with a read-only PAT kept in `localStorage`.
- Writes from the PWA (gym check-ins etc.) are more inbox files.
Latency is minutes to an hour, which is fine for daily totals. If you'd rather keep everything public, encrypt with a shared passphrase: WebCrypto PBKDF2 + AES-GCM round-trips in Node 26 [V]. But Shortcuts can't encrypt, so the inbox still needs a private repo or a relay.

**6–7. Tunnels, CloudKit.** Every tunnel forwards to a local process, so it still needs an always-on host, and iOS can't host one. CloudKit needs a $99/yr membership, and Shortcuts can't sign server-to-server requests.

## Ranked shortlist
1. **Supabase Free.** One vendor for DB, REST, cron and push; the Shortcut is one POST. Add a weekly keep-alive ping. *Best overall.*
2. **GitHub-only (private data repo + Actions).** No new account, ¥0. Costs: latency, cron jitter, PATs. *Best if the rule is "no new accounts".*
3. **Val Town.** Least porting, but the free limits are unverified.
4. **Firebase Spark.** Only works as a hybrid with Actions.
Not recommended: Render, Vercel, Deno Deploy, Netlify, Oracle/PocketBase, tunnels, CloudKit (reasons in the table).
