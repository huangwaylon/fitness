# No Mac: the smallest backend any host can run

**Verdict:** the backend shrinks to **two append-only logs and three endpoints**; scores, yen, ledger and harvest become a pure function in the PWA. Any host that can check a token, stamp the time and append rows works: Apps Script ([google-apps-script.md](google-apps-script.md)), a Worker, or anything in [other-options.md](other-options.md).

[V] = tested here, [U] = not verified. Prototype (not committed): `/tmp/nomac-arch/` (`reduce.ts`, `compare-*`, `bench.mts`, `export.sh`).

## 1. Compute-on-read
**What to store:**
- **`ingest` log:** `{person, receivedAt, metrics[], workouts[]}`, one row per Shortcut POST.
- **`events` log:** `{id (client UUID), person, at, type, …}`. Types: `checkin` (done true/false), `confirm`, `presence`, `spend`, `approve`, `transfer`, `harvest`, `prefs`, `visibility`, `highfive`.
- **Host config:** token hashes → person.

Everything else (`ledger_entry`, `week_lock`, `daily_metric`, `device`…) is derived.

**Ledger as a function:** `paid(week, bucket) = max(payout(inputs received ≤ Sun 19:30), payout(inputs received ≤ Wed 04:00))`. Before Wednesday only the first term counts. That's exactly the Mac's earn + top-up.
- **"Inputs only grow" isn't enough on its own [V].** A late long walk can remove the only rest day. In a test, B scored 50 at Sunday 19:30 and 45 at Wednesday 04:00. The `max` keeps ¥2,500, same as the Mac. Scoring the latest data would claw back ¥350.
- **Locks become cutoffs.** Late data, confirmations after the lock, and check-ins outside the 48 h window are ignored on read. Replay order decides the purse: a spend that would overdraw is void, and approval needs the partner. The host enforces no rules.
- **`receivedAt`/`at` must be stamped by the host**, not the phone.

**Results [V]:**
- **Real data:** a backup copy of `island.db` (62 metric rows, 3 check-ins; no settled weeks yet). Mac `scorePersonWeek`/`getWeekView` vs the reducer: **16/16 identical**.
- **Timeline sim:** the real Mac code (`ingestShortcut` with the user's `{dates, steps, exercise_minutes}` body, check-ins, spends/approvals, transfer, harvest, `runSettlement` every 30 min). Inputs: A's real days, synthetic B, late syncs, an untick, an overdraw. **340 checkpoints, 0 differences** in the full `WeekView`, including 12 top-ups.
- **Cost:** reducer + scoring is **14 KB min / 5.9 KB gzip**, about 4% of today's JS. Parsing the Shortcut body in the client would add 97 KB gzip (zod), so parse on the host.
- **Speed:** `weekViewAt` takes **13 ms at 1 year and 26 ms at 2 years** of data (10 syncs/day/person, M-series Mac, with a per-week index). iPhone maybe 2–3× slower [U].

**Volume per year:** about 7.3k ingest rows plus 2k events, **75 KB gzip** [V synthetic]. The current Shortcut re-sends 31 days on every run, so cut it to 2 days.

**New risk: rule edits re-price history.** Fix: give `MONEY`/`SEASONS` effective-from weeks, or have the first client after Wednesday 04:00 append a `checkpoint` event with that week's paid buckets, which the reducer then prefers.

## 2. Minimal API contract
| Endpoint | Body | Host does |
|---|---|---|
| `POST ingest` | Shortcut JSON + token | checks token → person, stamps `receivedAt`, appends |
| `GET state?since=<cursor>` | token | returns new rows and the cursor |
| `POST event` | `{token, id, type, …}` | person from the token (never the body), stamps `at`, appends if `id` is new |

- **Auth:** one long random token per person (optionally separate Shortcut and PWA tokens). Store only hashes; to revoke, rotate.
- **Pairing:** paste the token inside the *installed* PWA.
- **Writes:** client UUIDs make retries idempotent; host order resolves conflicts.
- **Mapping:**
  - **Sheet:** tabs `ingest` and `events` (`at | person | id | type | json`), tokens in Script Properties, `LockService` around appends.
  - **SQL:** two tables, `ON CONFLICT(id) DO NOTHING`, `WHERE seq > ?`.
  - **KV:** key `ev:<ulid>`, prefix-list after the cursor (consistency [U]).
- **Optional (scripted hosts):** redact the partner's habit keys to `h1`–`h3`.

## 3. Notifications without a server
- **[V] Apple's iOS 27 Shortcuts guide:**
  - "Time of Day" is one of the automations that "can run automatically" once *Allow Running When Locked* is on: "without asking you for confirmation", with no run notice.
  - **Show Notification** "creates a system notification… runs instantly".
- **Recipes:**
  - Daily 20:00: `GET state`, then **If** not ticked today → Show Notification.
  - Sunday 19:30: notify (harvest).
  - 25th: notify (payday).

  No VAPID, no scheduler.
- **[U]:** tapping the notification may open Shortcuts rather than the PWA, *Open URLs* opens Safari, and locked-phone delivery needs a Phase 0 test.
- **Web push** needs a cron plus ES256 signing. Apps Script has no ECDSA. Cloudflare Cron + WebCrypto could do it [U].

## 4. Shortcut changes (today: newline lists + bearer header)
| Host style | Change |
|---|---|
| JSON + header (Worker, Supabase Edge, Val Town) | URL only |
| Token in body/query (Apps Script) | URL; delete the header; add a `token` field |
| Form-encoded | Request Body → Form, same fields + `token` |
| Google Form | `formResponse` with `entry.N` fields; no auth, no JSON reply. **Avoid** |

On every host: a 2-day window, and the gym Shortcuts become `POST event {type: presence}`.

## 5. Trade-offs
**Lost:**
- Health data leaves home.
- The partner's phone downloads raw partner numbers, so `visibility_pref` is cosmetic unless the host redacts them.
- Apps Script takes 1–4 s per call.
- No web push or one-a-day priority logic.
- History can be re-priced, and two app versions can disagree.

**Simpler:**
- No scheduler, migrations runner, Funnel, VAPID keys, pairing CLI or SQLite backups.
- No "Mac off through Wednesday" catch-up or 8-week lookback.
- Offline-first is free; backup = JSON download.

## 6. Recommendation framework
1. **Must have:** HTTPS, CORS for `huangwaylon.github.io` (or plain-text simple requests), token check, host timestamp, append + read-since.
2. **Prefer** hosts that run code (Apps Script, Workers). That enables redaction, parsing on the host and person binding.
3. **Choose by** privacy, latency and whether web push matters. If it doesn't: **Apps Script + Shortcuts notifications**. If it does: **Worker + D1 + Cron**.
4. **Before switching:** add `checkpoint` events (or effective-dated rules) and a `version` field on events.
