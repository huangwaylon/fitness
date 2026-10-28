# No Mac, round 2: no-code DBs, JSON stores, automation glue and push channels
Survey, 2026-10-29. Per [minimal-backend.md](minimal-backend.md), the store only appends `ingest`/`events` rows (~7.3k + 2k a year) and returns them.
**[V]** = official page fetched or tested here (spikes in `/tmp/nomac2-glue/`). **[U]** = from memory, or the page was blocked or silent.
**Blocked by the proxy (allowlists not edited):** api.notion.com, api.telegram.org, `*.upstash.io`, api.cloudflare.com, npoint, kvdb, Pipedream endpoints, IFTTT, Zapier, Make.

**Dropped without a table row:**
- npoint and kvdb: no auth model worth trusting [U].
- Cloudflare KV over HTTP: no CORS [U]; with a CF account, use the round-1 Worker instead.
- IFTTT, Zapier, Make: webhooks need a paid tier, or the ops run out [U].
- Discord webhooks: work [V CORS] but only if both of you use Discord.

## Comparison
| Option | Truly ¥0? | Key free limit | Shortcut writes? | Browser CORS | Fits our data? | Verdict |
|---|---|---|---|---|---|---|
| **Airtable** | Yes | **1,000 records/base, 1,000 API calls/month** [V] | Yes | `*` [V] | **No** (~600 Shortcut calls/month alone) | Reject |
| **Notion API** | Yes | 3 req/s [V] | Yes (verbose) | Blocked; reportedly none [U] | No browser read | Reject |
| **Baserow cloud** | Yes | 3,000 rows/workspace [V] | Yes | `*` [V] | ~1 year | Possible, not better |
| **JSONBin.io** | Yes | **10,000 requests total, never renew**; 100 KB bin [V] | Yes | `*` [V] | **No** (~1 year; overwrite races) | Reject |
| **Upstash Redis** | Yes | 500K commands/month, 256 MB, 10 GB bandwidth [V] | Yes (REST + write token) | Not reachable here [U]; read-only token meant for web clients [V] | Yes, easily | **Best tiny store**, see below |
| **Pipedream free** | Yes | Unpublished daily cap; free is **"Development only"** [V] | Yes | Blocked | Yes | Reject |
| **LINE Messaging API** | Yes | **200 messages/month** on the Communication plan in Japan, counted per recipient [V] | Not as a log | Preflight 403, no CORS [V] | Push only | **Good push channel** |
| **Telegram bot** | Yes [U] | ~1 msg/s per chat [V] | Not as a log | Blocked here [U] | Push only | Good push channel, if both use Telegram |
| **ntfy.sh** | Yes, no sign-up [V] | 60-request burst, then 1 per 10 s; messages cached 12 h [V] | Yes (plain POST) | `*` [V] | No (12 h cache) | Good push channel; privacy is weak |
| **Pushover** | **No**: US$4.99 one-off per platform, after a 30-day trial [V] | 10k/month | Yes | `*` [V] | — | Breaks the ¥0 rule |

## Notes
**No-code DBs.** The Shortcut can call all of them (*Get Contents of URL* supports GET/POST/PUT/PATCH/DELETE with JSON bodies [V], [guide](https://support.apple.com/guide/shortcuts/request-your-first-api-apd58d46713f/ios)). Quotas and tokens are what rule them out. Airtable's free plan ([plans](https://support.airtable.com/docs/airtable-plans), [rate limits](https://airtable.com/developers/web/api/rate-limits): 5 req/s/base) is far too small. Any token shipped to the PWA can read **and write** the whole table, since none of these has per-row auth. Baserow ([pricing](https://baserow.io/pricing)) is the only one that fits for a while. The reducer needs a host timestamp (`receivedAt`); a `created_time` field could supply it [U].

**Upstash Redis** ([pricing](https://upstash.com/pricing/redis), [REST](https://upstash.com/docs/redis/features/restapi)). Every database gets a full token and a **read-only token** "when you access Upstash Redis from web and mobile clients" [V].
- Shortcut: `POST /eval` with a short Lua script that does `RPUSH ingest` with `redis.call('TIME')`, so the **host stamps the time** [U: EVAL over REST].
- PWA: `LRANGE ingest <cursor> -1` with the read-only token.
- Problem: PWA *writes* (check-ins, spends) need the full token in the browser, and that token can also `FLUSHALL`. Redis ACL users could narrow it [U].
- Other gaps: person comes from the body, no redaction, and inactive free databases may be archived [U].

**Messaging and push (Japan).** LINE Notify closed in March 2025 [U]. The Messaging API is the replacement.
- [Pricing](https://developers.line.biz/en/docs/messaging-api/pricing/): 200 free messages/month, and replies don't count [V]. Messages count "the number of people you send the message to" [V] ([sending](https://developers.line.biz/en/docs/messaging-api/sending-messages/)).
- Budget: 20:00 daily ×30 + Sunday harvest ×4 + payday ×1 = 35 sends × 2 people = **70/month**, within the 200.
- No webhook server needed: use **broadcast** (all friends of the official account, no user IDs) [V]. Pushing to a specific user ID needs a webhook or the console's "Your user ID", which only covers yourself [V] ([user IDs](https://developers.line.biz/en/docs/messaging-api/getting-user-ids/)).
- Not usable from the browser (no CORS [V]), and the channel token must stay secret, so the sender is a cron.

**Telegram**: `sendMessage` via GET or POST [V] ([Bot API](https://core.telegram.org/bots/api)). Each user `/start`s the bot once to provide a chat ID. **Not a log**: updates are kept "no longer than 24 hours" [V], there's no history API, and bots can't see other bots' messages [V].

**ntfy.sh**: tested [V] publish + `?poll=1&since=all` on a random topic. `expires = time + 43,200 s` (12 h), so **it can't store anything**. Scheduled delivery works up to 3 days (`Delay: 4d` rejected [V]). `At: tomorrow, 20:00` is parsed in **UTC** (05:00 JST [V]), so pass a Unix time. Without an account, "the topic is essentially a password" [V] (no end-to-end encryption), and the iOS app is "bare bones and quite frankly a little buggy" ([FAQ](https://docs.ntfy.sh/faq/)) [V]. Because of CORS `*`, the **PWA can post "partner checked in"** straight to the partner's topic.

**Who triggers a 20:00 / Sunday push without a server?** Options:
1. **A Shortcuts "Time of Day" automation on each phone** (round 1 [V]). It's free, runs on time, sends nothing over the network, and can check `GET state` first.
2. GitHub Actions cron calling LINE/Telegram/ntfy. Free, but runs can be late or dropped (round 1 [V]). Keep the token in Actions secrets.
3. An Apps Script trigger (±1 h [U]) or Cloudflare Cron.

Server-side channels only add value for partner pings, or if local notifications fail in Phase 0.

**Local-first / no backend.** Not feasible. Problems:
- *Open URLs* opens Safari, not the installed web app, and home-screen web apps keep storage separate from Safari [U], so a `#data=` hash never reaches the PWA's storage.
- The PWA can't read iCloud Drive, Notes or Reminders, and the PWA's own events (check-ins, spends) have no way back to the partner.

## Verdict
- **No no-code DB or JSON bin beats round 1's Worker + D1 or Apps Script.** Airtable and JSONBin run out of quota, Notion can't be read from the browser, and Baserow and Upstash need workarounds for auth and timestamps.
- **Upstash Redis** is the only credible "dumb store" fallback, with a read-only token in the PWA and Lua for host timestamps.
- **Push:** keep **local Shortcuts notifications** as the default (¥0, no server). For optional partner pings, **ntfy.sh straight from the PWA** is the simplest. **LINE broadcast from a GitHub Actions cron** (70 of 200 free messages/month) suits Japanese users who'd rather get a LINE message. Avoid Pushover (paid) and Pipedream (development-only free tier).
