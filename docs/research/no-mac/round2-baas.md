# Round 2: client-direct BaaS (no server code of ours)
2026-10-29. **[V]** = verified (official page fetched, or tested locally). **[U]** = unverified. Spikes: `/tmp/nomac2-baas/`. No site was blocked this round.

Assumes compute-on-read: the backend stores **uploads** (the Shortcut's newline lists + a **host** timestamp) and **events**.

## Comparison
| | **Supabase Free (RPC + secret)** | **Firebase Spark** | Appwrite Cloud Free | PocketHost |
|---|---|---|---|---|
| ¥0 / card | ¥0; 500 MB DB, 5 GB egress [V]; card not mentioned [U] | ¥0, "No payment method needed" [V] | ¥0; 2 GB storage, 5 GB bandwidth, 75K MAU [V] | **No free tier**: $9.99/mo, 7-day trial [V] |
| Idle pause | After 7 days of low activity. **API requests count** [V] | None known [U] | **After 7 days without Console activity.** API traffic doesn't count [V] | — |
| Shortcut calls | **1** (URL + secret moves into the body) | **2** (sign-in, then commit) | 1 (API key header) [U] | — |
| Tested here | **Yes:** real PostgREST 16.5 + Postgres 18 | **Yes:** Auth + Firestore emulators | Docs only | Docs only |
| PWA bundle (gz) | **~0** (plain `fetch`); supabase-js +59 KB [V] | Auth + Firestore lite +68 KB; full Firestore +178 KB [V] | +31 KB [V] | — |
| UI hosting | Not included: Firebase Hosting or another host | **Firebase Hosting**, works for a private repo | Appwrite Sites (free) [V] | — |
| Push | pg_cron + Edge Function `web-push` [U] | **No.** FCM v1 needs a service-account OAuth token, so a server [V] | Functions [U] | — |
| Data region | Tokyo selectable [U] | Firestore `asia-northeast1` [U]; Auth is global | No Tokyo region [U] | — |
| Effort | **2 days** | 3 days | — | — |

Current PWA JS is ~86 KB gz, so the Firebase SDK would nearly double it.

## 1. Firebase Spark
**Quotas [V]** ([pricing](https://firebase.google.com/pricing)): Firestore 1 GiB, 50K reads/20K writes/20K deletes per day. Hosting 10 GB stored, 360 MB/day transfer. Auth 50K MAU. Cloud Functions are "Not applicable" on Spark, so they need Blaze. FCM is free.

**Shortcut without a server: works [V, emulator].**
1. `POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=<web key>` with `{email, password, returnSecureToken:true}`. The reply has `idToken` (1 h), `refreshToken` and `localId`. An alternative is `POST https://securetoken.googleapis.com/v1/token?key=…` with a form body `grant_type=refresh_token&refresh_token=…`, which returns `id_token`.
2. `POST https://firestore.googleapis.com/v1/projects/<id>/databases/(default)/documents:commit` with `Authorization: Bearer <idToken>` and this body:
   `{"writes":[{"update":{"name":"…/documents/uploads/<uid>/items/<yyyyMMddHHmmss>","fields":{"dates":{"stringValue":…},…}},"currentDocument":{"exists":false},"updateTransforms":[{"fieldPath":"receivedAt","setToServerValue":"REQUEST_TIME"}]}]}`
   Build it with nested **Dictionary** actions.

**Rules (emulator, 12/12 as intended) [V]:** a `config/members` uid map, written once in the console, gates everything. Each person can only `create` under their own uid, and `receivedAt == request.time` makes the host timestamp unforgeable. `hasOnly` fixes the field list, and size caps apply. There is no update or delete.
- Blocked: a forged timestamp (403), writing to the partner's path (403), a stranger's account (403 for read and write), a re-send with the same id (409), and update/delete (403).
- Allowed: the partner reads both people's data, which compute-on-read needs.

**Hosting:** `firebase deploy --only hosting` runs from a local folder, or from Actions with a service-account secret [U]. It doesn't depend on repo visibility, so **it solves private-repo UI hosting**. `<id>.web.app` is also its own origin (fixes the shared-localStorage issue in 0013).

**Failure modes:**
- **Read quota.** Re-reading every upload on each app open (hourly uploads × 2 people) can approach 50K/day. Reads must be incremental (`receivedAt > lastSeen`), with a local cache.
- The daily quota resets at Pacific midnight [U].
- There's no push. Use the Shortcuts Time-of-Day reminder from round 1.

## 2. Supabase direct (recommended of this group)
**Design, tested over HTTP with real PostgREST [V]:**
- Tables live in a schema that isn't exposed to the API. Supabase grants `anon` access on `public` by default [U], so keep them out of `public`.
- Three `SECURITY DEFINER` functions are granted to `anon`, and each checks `sha256(secret)` against `people`:
  - `ingest(secret, dates, steps, exercise_minutes)` inserts an upload. `received_at` defaults to `now()`.
  - `add_event(secret, type, payload)` records an event.
  - `feed(secret, since)` returns uploads and events since a time.
- Results: a bad secret gets 403, and anon gets 401 on the tables. CORS is `*`, and the preflight allows `apikey` and `content-type`. The newline lists arrive intact.

An RLS variant with Supabase Auth also passed 12/12 in PGlite, but it needs supabase-js (+59 KB). **The secret-RPC variant needs no Auth and no SDK.**

**Shortcut change:** set the URL to `https://<ref>.supabase.co/rest/v1/rpc/ingest`. Add the header `apikey: sb_publishable_…` (publishable keys go in `apikey`, not `Authorization`; the request runs as `anon`) [V] ([keys](https://supabase.com/docs/guides/api/api-keys)). Move `isl_…` from the bearer header into the body as `secret`. Reading it from a custom header via `request.headers` should work, but whether Supabase's gateway passes it through is [U].

**PWA:** replace the API client with `fetch` to `feed`/`add_event`. Pairing stays "paste your secret".

**Pausing [V]** ([docs](https://supabase.com/docs/guides/platform/free-project-pausing)): "sufficient user database activity over the past week". A few requests a day is enough, and API requests count. The owner gets a warning email about a week before the pause, and a paused project can be restored with one click for a year. The daily Shortcut uploads keep it awake, but **a phone-free week (travel) could pause it**. A keep-alive is optional.

**UI:** Supabase doesn't host static sites. Use Firebase Hosting for the UI only (no Firebase data), or Cloudflare Pages [U].

**Failure modes:** the pause above; the 500 MB cap (years of headroom); the secret sits in the Shortcut and localStorage, as today.

## 3. Appwrite Cloud and PocketHost
- **Appwrite Free [V]** ([plans.ts](https://github.com/appwrite/appwrite/blob/main/apps/console/src/lib/pricing/plans.ts), [changelog 2026-02-20](https://github.com/appwrite/appwrite/blob/main/apps/console/src/content/changelog/entries/2026-02-20-1.markdoc)): projects pause after "no **development activity** for 7 consecutive days… remain active as long as they show development activity in the Console". Our steady API traffic wouldn't keep it alive, so someone would have to log in weekly. **Rejected.**
- **PocketHost [V]** ([pricing](https://pockethost.io/pricing)): paid only. Self-hosted PocketBase needs a server. **Rejected.**

## Verdict
1. **Supabase secret-RPC + Firebase Hosting (UI only).** One URL/body change to the Shortcut, no SDK, host timestamps from `now()`, and roughly 2 days of work. The one risk is the inactivity pause, which comes with a warning email and a one-click restore.
2. **Firebase Spark (data + hosting).** One vendor, no pause, and the rules are verified. Costs: a 2-call Shortcut, +68 KB of SDK (or hand-written REST), care with the read quota, and no push. About 3 days.

Neither beats round 1's Cloudflare Workers + D1 on Shortcut simplicity (URL only) or push. Its UI could move to Cloudflare Pages or Firebase Hosting once the repo goes private.
