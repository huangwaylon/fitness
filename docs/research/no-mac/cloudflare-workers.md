# No Mac: Cloudflare Workers + D1 (free plan)
Research and local spike, 2026-10-28. [V] = verified by running it or from a cited doc. [U] = unverified.

## Verdict
**Feasible, free, and our workload fits easily.** Keep the UI on GitHub Pages and move the API to one Worker at `https://island-fund-api.<sub>.workers.dev`, with D1 as the database and Cron Triggers for the jobs. No domain and no Mac needed. The real cost is porting `app/src/lib/server/**` from synchronous better-sqlite3 to async D1 (about 77 `.run()/.get()/.all()` call sites and 2 transactions). The scoring module moves over unchanged.

## Architecture
```
iPhone Shortcut ──POST /ingest/shortcut/:person (Bearer isl_…)──┐
PWA (huangwaylon.github.io/fitness) ──/api/* (Bearer, CORS)─────┼─► Worker ─► D1 (SQLite)
Cron (UTC) ──scheduled()──► settlement + 1 push/day ────────────┘      └─► Apple Web Push
```

## Spike (`/tmp/nomac-cloudflare`, wrangler 4.154.0, local only, no account)
These parts were reused unchanged: `scoring/*`, `config/rules.ts`, `types.ts`, `db/schema.ts`, `parseShortcut` and `workout-names.ts` (`node:crypto` works with `nodejs_compat`). New code is about 280 lines: a router, D1 ingest, week loading and settlement.
- [V] `wrangler d1 migrations apply island --local` applied our 4 Drizzle SQL migrations unchanged. Drizzle `drizzle-orm/d1` runs our schema, and `db.batch()` replaces `db.transaction()` (D1 batches are atomic).
- [V] `POST /ingest/shortcut/A` with the user's format (`dates`/`steps`/`exercise_minutes` as newline text, plus workouts) returned `200 {"metrics":14,"workouts":3}`. Re-sending gave the same result (idempotent). Other cases behaved as expected: wrong person → 403, no token → 401, steps with no dates → 422 with the app's hint.
- [V] `GET /api/week?week=2026-11-02` returned scores 62/62, ¥3,100 each, team ¥1,240. CORS answers only `https://huangwaylon.github.io` (preflight 204; any other origin 403). A Shortcut token on `/api` → 401.
- [V] `scheduled()`, fired via `/cdn-cgi/local/scheduled`: at Sun 10:29 UTC nothing happened. At 10:30 UTC (19:30 JST) it wrote 5 provisional ledger rows, and a repeat run wrote nothing. A run on Tue 19:00 UTC (Wed 04:00 JST) caught up provisional + final and locked the week.
- [V] **CPU** (Node 26, same V8 engine; production limits apply to CPU only, not I/O wait): parsing the user-format payload 0.04 ms, a raw-sample payload (2,400 samples, 85 KB) 1.6 ms, scoring A + B + payout 0.02 ms warm / 0.6 ms cold. Global-scope startup 16 ms (limit 1 s). Local wall time per request including D1: 1–12 ms. `performance.now()` in workerd only shows whole milliseconds (Spectre mitigation), so real per-request CPU time must come from the dashboard. [U] In production we expect 2–4 ms, well under 10 ms.
- [V] Bundle 562 KiB minified, 126 KiB gzip (zod + drizzle make up most of it). The limit is 64 MiB.
- [V] **Web push**: `@block65/webcrypto-web-push` 2.0.0 (updated 2026-09) produced a VAPID ES256 JWT and an **aes128gcm** body inside workerd, using our existing `web-push`-format VAPID keys. `@pushforge/builder` also runs but emits legacy `aesgcm`, so avoid it. [U] Actual delivery to `web.push.apple.com`.

## Free-plan limits
| Item | Free | Our use | Source |
|---|---|---|---|
| Requests | 100,000/day, resets 00:00 UTC (09:00 JST) | < 500 | [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) [V] |
| CPU | 10 ms per request **and per cron run**; occasional overruns tolerated, consistent overruns → Error 1102 | ~2 ms | same [V] |
| Subrequests | 50 per invocation | ≤ 4 pushes | same [V] |
| Cron Triggers | 5 per account, **UTC**, weekdays 1 = Sunday (use names), timing not guaranteed | 1–3 | [Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/) [V] |
| D1 | 5 M rows read, 100 k rows written per day; 500 MB per DB, 5 GB total | ~2 k writes/day | [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/) [V] |
| D1 queries | 50 per invocation | ~15 (`/api/week`) | D1 limits [V] |
| Time Travel | 7 days point-in-time restore | backups | [Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/) [V] |
| `*.workers.dev` | free, on by default, "for personal or hobby projects" | yes | [workers.dev](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/) [V] |
| Cold start | isolates, "eliminates the cold starts of the VM model" | n/a | [How Workers works](https://developers.cloudflare.com/workers/reference/how-workers-works/) [V] |
| Credit card | not stated in the docs | none expected | [U] (R2 asks for a card, but we don't need R2) |

If the D1 daily limit is exceeded, queries error until 00:00 UTC. That is very unlikely at our volume.

## Pages + Worker, or SvelteKit `adapter-cloudflare`?
- **Pages + small Worker API (recommended).** The PWA origin doesn't change, so there's no reinstall and no re-pairing. Only the repo variable `API_BASE` changes, plus the Shortcut URL. CORS and the bearer-token setup stay as they are (ADR 0013).
- **`adapter-cloudflare` 8.0.1 (one Worker, UI + API).** Gives one origin (no CORS, HttpOnly cookie again, no longer shares `huangwaylon.github.io`), and static assets are free. Downsides: the PWA must be reinstalled and re-paired and push re-subscribed. [V] The adapter emits `fetch` only (no `scheduled`), so a wrapper entry is needed for crons. svelte.dev was blocked from here, so its docs weren't read. A reasonable later step, not needed for "no Mac".

## Migration effort (about 1–2 days)
1. Make `lib/server/**` async on `drizzle-orm/d1`. Replace `db.transaction` with `db.batch` (ingest, settlement). `redeemPairingCode` needs `UPDATE … RETURNING` and then an insert.
2. Swap Node-only APIs. `node:crypto` randomBytes/timingSafeEqual → WebCrypto (`crypto.subtle.timingSafeEqual` exists on Workers). `zlib` → `CompressionStream`. `process.env` → `env`. `web-push` → `@block65/webcrypto-web-push`.
3. Replace the in-process scheduler with **one cron, `*/10 * * * *`**, running the existing state-based `tick()`. It already catches up, so imprecise cron timing doesn't matter. The in-memory rate limiter has no lasting state in Workers: move it to a D1 table or drop it.
4. Admin CLIs (`pair`, `token`, `devices`) print SQL for `wrangler d1 execute island --remote --command …`.
5. Tests: [U] `@cloudflare/vitest-pool-workers`, or keep the pure tests and add D1 tests.

## Deployment (user)
```
npx wrangler login                                   # browser OAuth, free account
npx wrangler d1 create island                        # paste database_id into wrangler.jsonc
npx wrangler d1 migrations apply island --remote
sqlite3 app/data/island.db .dump > dump.sql          # once, from the Mac: data + device rows [U: strip __drizzle_migrations]
npx wrangler d1 execute island --remote --file dump.sql
npx wrangler secret put VAPID_PRIVATE_KEY            # also VAPID_PUBLIC_KEY, VAPID_SUBJECT
npx wrangler deploy                                  # → https://island-fund-api.<sub>.workers.dev
```
Then set the repo variable `API_BASE` to the workers.dev URL and re-run the Pages workflow. **Shortcut step 13 URL:** `https://island.<tailnet>.ts.net/ingest/shortcut/` → `https://island-fund-api.<sub>.workers.dev/ingest/shortcut/`. The tokens stay valid if the `device` rows are migrated.

**Backups:** Time Travel (7 days, `wrangler d1 time-travel restore island --timestamp=…`), plus `wrangler d1 export island --remote --output=…` (this blocks the database while it runs). If that is automated in GitHub Actions, encrypt the dump: the repo is public.

## Risks
- **Privacy:** health data and TLS termination move to Cloudflare. ADR 0010 counted Cloudflare terminating TLS against the Tunnel option.
- The free 10 ms CPU limit is per invocation. Keep raw-sample payloads modest. Day totals are best: about 0.04 ms.
- Daily limits reset at 09:00 JST. Crons are in UTC with Cloudflare's own weekday numbering. Cron timing isn't guaranteed, which the state-based catch-up absorbs.
- Delivery to Apple push [U]. Production CPU numbers [U]. No-card signup [U].
