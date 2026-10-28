# Software Engineer: Round 4 (no VPN on the phones)

User input: *"Can we avoid Tailscale or VPNs on the phones? Simpler? ngrok? Or GitHub Pages + a spreadsheet?"* There **is an always-on Mac at home in Tokyo.**
Legend: **[V]** verified this round (source cited) · **[U]** unverified.

## TL;DR
- **Recommendation: Mac + Tailscale Funnel.** Tailscale runs **only on the Mac**. The phones just open a normal public HTTPS URL `https://island.<tailnet>.ts.net`. Cost ¥0/month, no domain needed, and TLS is end to end (the relay can't read the health data).
- **Runner-up: Mac + Cloudflare Tunnel** on a cheap domain you own. It's more mature and has edge rate limiting, but Cloudflare terminates TLS, so it can read the traffic, and you need a domain.
- Either way, **the app has its own auth**: a one-time pairing code sets a long-lived session cookie in the installed PWA, plus per-device bearer tokens for Health Auto Export (HAE) and Shortcuts.
- **Reject:** ngrok (free plan breaks the PWA; $10/mo to fix), GitHub Pages + Google Sheets (no web push, weak ledger integrity, health data in Google), and the Pages + tunnel hybrid (cross-site cookie pain, no benefit).

## 1. Options compared (nothing installed on the phones)

| | (a) Cloudflare Tunnel (+Access) | (b) ngrok | **(c) Tailscale Funnel** | (d) GitHub Pages + Apps Script/Sheets | (e) Pages + Mac API via tunnel |
|---|---|---|---|---|---|
| **Domain** | **Required.** "you must add a website to Cloudflare" before publishing a route [V] ([CF](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/create-remote-tunnel/)). Registrar sells "at cost, without markup" [V] (≈ $10/yr for .com [U]). Quick tunnels need no domain but get a random hostname each time, have "no uptime guarantee", and no SSE [V] ([CF](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/)), so they're unusable here. | Free plan: one **stable** dev domain, "cannot be changed" [V] ([ngrok](https://ngrok.com/docs/universal-gateway/domains/)) | **Not needed:** `*.ts.net` only [V] ([Funnel](https://tailscale.com/kb/1223/funnel)) | `user.github.io` | Pages + a tunnel hostname |
| **Monthly cost** | Tunnel $0 [U]; Access free tier [U: plans page blocked by proxy] | Free has an **interstitial page** on HTML traffic [V]. Removing it = Hobbyist **$10/mo** [V] ([pricing](https://ngrok.com/pricing)) | **$0** (Personal plan free [V]) | $0 | $0–$10 |
| **PWA works?** | Yes. *With Access in front:* the login redirects to the team domain, the session cookie defaults to 24 h [V] ([CF cookie](https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/)), and the out-of-scope redirect inside an iOS standalone PWA is fragile [U]. **Don't put Access in front of the PWA.** | Interstitial blocks the browser/PWA (a "Visit" cookie lasts only 7 days) [V] ([free limits](https://ngrok.com/docs/pricing-limits/free-plan-limits/)) | Yes | Yes (static) | Cross-site API: Safari blocks 3rd-party cookies, so you'd need bearer tokens in JS storage [U] |
| **HAE / Shortcuts POST** | Yes. Access **service tokens** = `CF-Access-Client-Id` + `CF-Access-Client-Secret` headers [V] ([CF](https://developers.cloudflare.com/cloudflare-one/identity/service-tokens/)). HAE supports custom headers [V]; Shortcuts headers [U] | Yes: "does not impact … accessing ngrok endpoints programmatically" [V] | Yes | Apps Script `doPost` event has **no headers field** (only `queryString`, `parameter`, `postData`…) [V] ([Apps Script web apps](https://developers.google.com/apps-script/guides/web)), so the token has to go in the URL. Whether HAE follows the 302 to googleusercontent is **[U]** | Yes |
| **Who can read payloads** | Cloudflare (TLS terminates at the edge) | ngrok | **Nobody:** "relay servers cannot decrypt" [V] | Google (stored in Sheets) | Tunnel provider |
| **Web push** | Yes | Yes (paid) | Yes | **Effectively no.** VAPID needs ES256 signing; Apps Script has no native ECDSA [U] | Yes, but the SW must live on the Pages origin |
| **Limits** | Mature, WAF/rate limiting at the edge | 5 GB / 100k req on Hobbyist [V] | "non-configurable bandwidth limits"; ports 443/8443/10000 only [V] (fine for 2 users) | 6 min/execution, 90 min/day trigger runtime, 20k UrlFetch/day (consumer) [V] ([quotas](https://developers.google.com/apps-script/guides/services/quotas)) | Two deployments |

**Why (d) GitHub Pages + Sheets is rejected:**
1. Pages can only be made private on **GitHub Enterprise Cloud** [V] ([GitHub](https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site)). On Free/Pro the site is public, so every byte of data must sit behind Apps Script auth anyway.
2. Tokens end up in URLs (no headers) [V].
3. No unique constraints or transactions in Sheets, so idempotent pay-once needs LockService plus hand-rolled checks [U].
4. Web push isn't practical [U].
5. Health data and a money ledger sit in a Google account.
6. The 9 endpoints *could* be written in Apps Script, but cold starts are slow (seconds) [U] and the HAE redirect behaviour is unknown [U].
It's not simpler once auth and integrity are added.

**Why (e) is rejected:** the Mac serves the static PWA just as easily. Splitting origins adds CORS, cross-site cookies, and a second deploy for no gain.

## 2. Recommendation: Mac + Tailscale Funnel

**Setup (about 30 min, once):**
1. Mac: install Tailscale, log in, and **disable key expiry** for this machine [U: admin-console option]. Energy settings: never sleep, "start up automatically after a power failure" (`sudo pmset -a autorestart 1 sleep 0`) [U].
2. Admin console: enable MagicDNS + HTTPS certificates. Make sure the policy file grants the `funnel` node attribute [V: requirement listed].
3. Run the app (Docker or launchd, auto-restart) on `localhost:3000`, then `tailscale funnel --bg 3000` [U: exact flag syntax; `tailscale funnel --help`]. URL = `https://<mac>.<tailnet>.ts.net` [V: ts.net only]. Rename the machine to `island` first, because the hostname becomes the PWA's origin.
4. On the Mac: `pnpm pair A` prints a **6-digit, 10-minute, single-use code**.
5. Each iPhone: open the URL in Safari → Add to Home Screen → open the installed app → enter the code → tap "Enable reminders" (web push, iOS 16.4+ [V]).
6. HAE automations + gym Shortcuts: URL `…/ingest/hae/A` and `…/api/presence`, header `Authorization: Bearer <device token>` (shown once in Settings → Devices).

**Monthly cost:** ¥0 (plus the one-time HAE purchase). The Mac's electricity is already being spent.

**Failure modes → mitigations**

| Failure | Effect | Mitigation |
|---|---|---|
| Mac asleep, rebooted or offline | HAE and Shortcuts POSTs fail | HAE re-sends yesterday + today on the next run; Wednesday final pass; autorestart + no sleep; a phone push if no data arrives for 24 h |
| Tailscale logged out / key expired | Funnel URL down | Disable key expiry; daily self-check job (`curl` its own public URL) |
| Funnel outage or bandwidth cap | Slow or unavailable | Payloads are small (aggregated JSON). Swap to the Cloudflare Tunnel runner-up |
| Public URL discovered by scanners | Bot traffic | App auth everywhere; rate limits; nothing useful served without a session or token |
| Origin change later (e.g. moving to Cloudflare) | PWA storage, session and **push subscriptions are tied to the origin** | Choose the final hostname **before** pairing. Changing it means re-adding to the Home Screen + re-pairing (5 min) |

**Runner-up: Cloudflare Tunnel.** Buy a domain at Cloudflare Registrar (≈ $10/yr [U]), run `cloudflared` as a launchd service, and route `island.<domain>` → `localhost:3000`. **Skip Access for the PWA**, and use our app auth instead. Optionally put an Access service-token policy on `/ingest/*` only [V: header-based service tokens]. Use it if Funnel proves flaky or if we want edge rate limiting / WAF. The tradeoff is that Cloudflare sees the plaintext health JSON.

## 3. App auth for a public origin (needed in every option)
- **Pairing → session:** the pairing code (above) creates a `device` row and sets a **signed, HttpOnly, Secure, SameSite=Strict cookie** (`__Host-session`, ~1 year, rolling). Codes are single-use, last 10 min, and lock after 5 attempts. Pair **inside the installed PWA**: Home Screen web apps keep storage separate from Safari [U], so a cookie set in a Safari tab wouldn't carry over.
- **Passkey (v1, optional):** WebAuthn for re-login if the cookie is lost (supported in Safari / Home Screen apps [U: Apple doc not fetched this round]).
- **Ingest tokens:** per device, 32 random bytes, stored as a SHA-256 hash, revocable in Settings. `/ingest/*` and `/api/presence` accept **only** bearer tokens (no cookies). All other `/api/*` accepts **only** the session cookie + an `Origin` check (CSRF).
- **Hardening:** rate limits (pairing 5/10 min per IP; ingest 60/min per token; everything else 120/min). Body cap of 20 MB on ingest and 64 KB elsewhere. Security headers (CSP `default-src 'self'`, HSTS). Log no payload bodies. Unknown paths → 404 with no stack traces. The partner-visibility filter stays server-side.
- **Shortcuts headers:** if "Get Contents of URL" header entry turns out to be awkward [U], put the token in the JSON body as `{"token": …}`. The server accepts either, for that one endpoint.

## 4. ADR updates this implies
- **0005 (client & hosting):** replace "Tailscale only, VPN On Demand on both iPhones" with "**Tailscale Funnel on the home Mac only; no VPN or app on the phones**. Public HTTPS origin `island.<tailnet>.ts.net`; app-level auth (pairing-code session + per-device bearer tokens); runner-up Cloudflare Tunnel." Remove "Nothing is exposed to the public internet". Add "the origin is fixed before pairing".
- **0001 (ingestion):** HAE posts to the public Funnel URL with `Authorization: Bearer`. This **removes the 'tunnel was down' failure mode**, so background uploads should get *more* reliable [U: confirm in Phase 0].
- **Web push:** works from the public origin unchanged. The Mac needs outbound access to `*.push.apple.com` [V, earlier research]. Subscriptions are per origin (see failure modes).
- **Gym presence (round 3):** the Arrive/Leave Shortcuts POST to the public URL with the device token. They no longer depend on VPN On Demand, which removes my biggest worry about running them while locked.
- **Privacy wording (PROPOSAL §4.4):** "Tailscale-only access" → "Public HTTPS endpoint, end-to-end encrypted to the home Mac (Tailscale Funnel); every request authenticated by the app."
- **User question list:** drop "OK to keep Tailscale on permanently on both iPhones?"
