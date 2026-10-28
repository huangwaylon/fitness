# Software Engineer: Architecture Recommendation

Owner: Software Engineer · Status: Round 1 discovery memo · Date: 2026-10-28
Detailed ingestion research: `docs/research/apple-health-ingestion.md` (sources, payload format, verification status)

Legend: **[V]** = verified against a cited source during research. **[U]** = unverified or assumed. Must be checked in week 1.

---

## TL;DR (opinionated)

| Area | Recommendation |
|---|---|
| **Health ingestion (MVP)** | **Health Auto Export (HAE) Premium Lifetime** ($24.99 once, Family Sharing covers both [V]) → REST API automation → our server. About 10 minutes of setup per phone, then hands-off. |
| **Health ingestion (v1)** | Our own **SwiftUI companion app** (HealthKit observer + anchored queries + background delivery) via **$99/yr Developer Program + TestFlight**. Replaces HAE and adds widgets, Watch complications and Live Activities. |
| **Diet** | Not automatable without a food logger. Use **1-tap "healthy habit" check-ins** (Action Button / Shortcut / widget / PWA button) plus anything that's already in Health (water). No calorie counting. |
| **Backend** | One small **TypeScript** service: **SvelteKit (adapter-node) + SQLite (WAL) + Drizzle**, in Docker on an always-on home **Mac mini or Raspberry Pi 5**. A $5 VPS also works. |
| **Network** | **Tailscale** (free Personal plan [V]) with **Serve** for HTTPS on `*.ts.net` [V]. Nothing on the public internet. **VPN On Demand = Always** on both iPhones [V]. |
| **Client (MVP)** | **PWA** installed to the iPhone Home Screen. Web push works on iOS 16.4+ [V]. Interim widget via Scriptable [U]. |
| **Rules engine** | Deterministic, re-runnable evaluation over daily aggregates. Days are **provisional until settled at D+2**. Ledger is **append-only** with unique idempotency keys. Late data produces **top-up deltas only, never clawbacks**. |
| **Money** | **Virtual ledger + monthly "Transfer Day" reminder.** A human moves the money and taps "Done". No bank APIs. |
| **Backups** | Litestream (continuous SQLite replication) to encrypted B2/S3 **or** nightly `sqlite3 .backup` + restic. Raw payloads kept so everything can be recomputed. |

---

## 1. Getting Apple Health data off the phones

Full comparison and citations are in `docs/research/apple-health-ingestion.md`. Summary:

| | (a) Health Auto Export → REST | (b) Shortcuts automation | (c) Own SwiftUI app | (d) OSS servers / SaaS |
|---|---|---|---|---|
| Ongoing manual work | **None** after setup | None if it works, but it fails when locked | None (TestFlight: re-upload every 90 days, automatable) | n/a |
| Reliability | iOS-scheduled, only while unlocked, all-or-nothing runs [V] | Fails if the phone is locked at trigger time [V] | Best available: hourly background delivery for most types [V], anchored sync with deletions [V] | Still need (a) or (c) on the phone |
| Setup effort | ~10 min/phone | Hours of fiddly Shortcut building | 2–4 weekends of Swift | Reference only |
| Cost | $24.99 lifetime, shared via Family Sharing [V] | $0 | $99/yr [V] (free accounts expire every 7 days [V], which is a non-starter) | Self-host or SaaS |
| Data control | 3rd-party closed app, but posts straight to *our* server | Full | Full | SaaS sends data to a 3rd party (rejected) |
| Extras | Widget, activity logs | Great for 1-tap writes | Widgets, complications, Live Activities | |

**Primary path:** (a) HAE. **Fallback / v1:** (c) native companion. **Supporting role:** (b) Shortcuts for manual check-ins only.

### HAE configuration we'll use (per phone)
1. **Automation "island-metrics"**: Health Metrics, JSON, Export Version 2, **Summarize Data on** (daily aggregates), date range **Default (previous day + today)**, the shortest cadence available. Metrics: steps, Apple Exercise Time, Apple Stand Hour, active energy, sleep analysis, dietary water, mindful minutes, plus any dietary metrics a logger writes.
2. **Automation "island-workouts"**: Workouts, JSON v2, no route data, no fine-grained metrics (keeps payloads small).
3. Header `Authorization: Bearer <per-person token>`. The URL identifies the person: `https://island.<tailnet>.ts.net/ingest/hae/<person>`.
4. Add the HAE Automations widget to the Home Screen; HAE says it improves run success [V]. Keep Background App Refresh on.

**Why "previous day + today" matters:** every run re-sends yesterday in full. The server **upserts** daily aggregates, so a missed run fixes itself on the next one, duplicates do no harm, and late watch syncs get picked up.

### iOS limitations we design around
- **Locked = unreadable.** HealthKit is encrypted while the phone is locked [V]. Data arrives after the next unlock and background window. Expect a lag of minutes to hours, and occasionally until the next morning.
- **Throttling.** Steps etc. are capped at hourly background delivery [V]. HAE "cannot sync at a guaranteed time or fixed interval" [V].
- So the UI shows **"today so far (syncing…)"** with a last-synced timestamp per person, and money is only **settled** for days that are safely in the past (section 5).

---

## 2. Diet and nutrition: what's really automatable

| Signal | Automatic? | How |
|---|---|---|
| Calories, macros | **No**, unless someone logs food in an app that writes to Health (MyFitnessPal, Lose It!, Cronometer [U]). HAE then exports it automatically. | Not recommended. It contradicts "≤10 s/day" and the charter's "not a calorie counter". |
| Water | Semi | Log water in an app or watch complication that writes to Health (e.g. WaterMinder [U]), or a 1-tap Shortcut "Log Health Sample: Water 500 ml" [U]. HAE exports `dietary_water`. |
| "Healthy meal" / habit check-ins | **One tap**, the honest minimum | PWA button, iOS **Shortcut on the Action Button / Back Tap / Home Screen** POSTing `{"habit":"veggie_dinner"}` to `/api/checkins`, later a native **interactive widget** (App Intent button; the tap doesn't count against the widget budget [V]). |
| Photo meal log | Optional, about 5 s | PWA camera upload to a "food diary" gallery. **No AI classification by default**, because it would send food photos to a third party unless we run a local model. Photos are good for cozy recaps, not for scoring. |
| Alcohol, sugary drinks, takeout | Check-in | "Booze-free day" or "no soda" as a 1-tap or evening yes/no. Partner can see it (light social accountability, honor system). |
| Mindfulness | Automatic | Apple Watch Mindfulness app writes mindful minutes to Health [U on HAE key name]. |

**Recommendation:** score diet with a **small set of positive daily habits** (e.g. veg with 2 meals, home-cooked dinner, water goal, no sugary drinks), each worth a small amount, via a **once-a-day evening check-in** (one push notification → one screen → up to 4 taps). That's an honor system, which is fine for a trusting couple. The Nutrition/Coach role should own the habit list.

---

## 3. Backend and hosting

### Stack choice
| Choice | Pick | Why |
|---|---|---|
| Language | **TypeScript** everywhere | One language for UI, API, rules engine and tests. Easy to share types (e.g. the HAE payload schema via `zod`). |
| Framework | **SvelteKit** + `adapter-node` | API routes and the PWA in one deployable. Small bundles (good on phones). Simple to make cute and animated. Next.js or Remix would be fine alternatives; there's no strong reason to prefer them for 2 users. |
| DB | **SQLite** (WAL mode) + **Drizzle ORM** + `better-sqlite3` | 2 users ≈ a few thousand rows a year. Zero ops, a single file, trivial backups, transactional. Postgres adds a service to run with no benefit at this scale. |
| Jobs | In-process scheduler (`node-cron`) | Nightly settlement, push reminders, backups check. No queue needed. |
| Push | `web-push` (VAPID) | Web push works without the Apple Developer Program [V]. |
| Packaging | Single Docker image + `docker compose`, or plain `launchd`/systemd | Easy to move between Mac mini, Pi and VPS. |

### Where to host
| Host | Cost | Pros | Cons | Verdict |
|---|---|---|---|---|
| **Home Mac mini (already owned?)** | $0 | Fast, FileVault disk encryption, always on | Home power/internet outages (data just queues on the phones) | **Preferred** if one exists |
| Raspberry Pi 5 + SSD | ~$100 once | Cheap, low power | Need to sort out SD/SSD reliability and disk encryption | Good |
| Small VPS (Hetzner/DO) | ~$5/mo | Best uptime | Health data on someone else's disk; harden SSH | Acceptable with Tailscale-only access |

### Network and security
- **Tailscale tailnet** with both partners' iPhones plus the server. `tailscale serve` provides HTTPS with a real cert at `island.<tailnet>.ts.net` [V]. The app is **not on the public internet**.
- **VPN On Demand = Always** on both iPhones so HAE background POSTs reach the server [V]. If the HAE activity logs show failures because the tunnel was down, expose **only** `/ingest/*` via **Tailscale Funnel** [V], protected by a bearer token, a 10 MB body cap and rate limiting.
- **Auth for the UI:** since only tailnet devices can reach it, use a simple per-person **passkey (WebAuthn)** or magic PIN plus a long-lived session cookie. Tailscale identity headers (`Tailscale-User-Login`) from Serve are an even simpler option [U: verify header availability].
- **Ingest tokens:** one random 32-byte token per person and device, stored hashed and rotatable from the settings page.
- **Privacy:** no third-party analytics, fonts or CDNs; all assets self-hosted. Encryption at rest comes from the host's full-disk encryption (FileVault/LUKS). Backups are encrypted client-side (restic/age). Logs never include payload bodies.
- **Data minimization:** store daily aggregates + workouts summary only, plus compressed raw payloads for 90 days (for re-parsing bugs), then delete.

### Backups
- **Litestream** continuously replicating the SQLite file to Backblaze B2 / S3 with client-side encryption (cheap, cents per month) **or** nightly `sqlite3 .backup` → `restic` to an external drive + B2.
- Monthly automated **restore test** (a job restores to a temp file and runs `PRAGMA integrity_check` and a row count). Failures send a push notification to the builder.
- The **ledger is the precious part.** Metrics can be re-ingested by switching HAE to "Previous 7 Days" (or a manual export once in a disaster), but ledger history can't be recreated, so it must be backed up.

---

## 4. Client delivery: how the app gets onto the iPhones (and better alternatives)

The user expects to use the app mainly on iPhone (mobile Safari/PWA is acceptable). Options compared:

| # | Option | Daily UX | Widgets / Lock Screen / Watch | Notifications | Health ingestion | Cost and logistics | Build effort |
|---|---|---|---|---|---|---|---|
| 1 | **PWA on Home Screen** | Full-screen, app-like, offline shell via service worker | **None.** PWAs can't make iOS widgets, complications or Live Activities. App icon badge via Badging API [V]. | **Web push on iOS 16.4+**, Home Screen web apps only, permission must come from a tap [V]. Must show every push (no silent push) [V]. | **None.** No HealthKit from the web, so ingestion needs HAE or a native helper. | $0. Update by deploying. No Apple account. | Lowest |
| 2 | **Native SwiftUI app (reads HealthKit itself)** | Best: native feel, haptics, smooth animations | **Yes:** Home and Lock Screen widgets, interactive widget buttons, Watch complications (needs a watchOS target), Live Activities | APNs, rich | **Yes, built in.** Removes the HAE dependency (observer + anchored queries + background delivery [V]). | **$99/yr** + TestFlight builds expire every **90 days** [V]. A free account means reinstalling from Xcode **every 7 days** [V], which fails the requirement. | Highest (Swift UI *and* a server UI for anything web-side) |
| 3 | **Hybrid: PWA UI + tiny native companion** (or HAE / Shortcut for ingestion) | PWA for the game. Companion mostly invisible. | Companion provides widgets + complications that read a `/api/summary` endpoint | Web push from the PWA, or APNs from the companion | Companion does HealthKit sync (or HAE in the MVP) | $99/yr once the companion exists | Medium. The companion is ~500–1,500 lines of Swift: sync + 2 widgets. |
| 4 | **Cross-platform shell** (Capacitor / Expo wrapping the web UI + HealthKit plugin) | Near-native. Same UI code. | Widgets and complications **still need native Swift extensions** | APNs via plugin | `@kingstinct/react-native-healthkit` is well maintained (about 720 stars, Expo config plugin, anchored queries, subscriptions) [V]. `@perfood/capacitor-healthkit` is in transition, covers few types and doesn't document background delivery [V]. | $99/yr (same signing and TestFlight constraints) | Medium-high: a JS toolchain *plus* Xcode, and background delivery still needs native code |
| 5 | **Widget-only helpers** (Scriptable, Widgy) reading our API | Doesn't replace the app; adds a glanceable widget | Home/Lock Screen widget showing "Island Fund $412 · today 3/4 🍎" | none | none | Scriptable is free [U: scriptable.app blocked by proxy] | ~1 hour of JS. A zero-cost stopgap. |

### Things to know about PWAs on iOS
- **Web push:** works for Home Screen web apps on iOS 16.4+, uses standard Push API + Service Worker + Badging API, and needs no Apple Developer Program [V] ([Apple: web push](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers)). Each partner must tap "Enable reminders" once inside the installed app.
- **Storage eviction:** Safari's 7-day cap on script-writable storage (IndexedDB, localStorage, caches) for sites you haven't interacted with exempts Home Screen web apps [U: webkit.org was blocked by the proxy, so I couldn't re-verify]. This barely matters for us: **the server is the source of truth**, and the PWA only caches the shell and last summary.
- **No HealthKit, no widgets, no Watch** from a PWA. That's why ingestion is HAE in the MVP.
- The session cookie is separate from Safari's, so you log in once inside the installed app.

### Recommendation
- **MVP: Option 1 + HAE + Option 5.** A PWA for the cozy island UI, HAE for ingestion, and optionally a Scriptable widget hitting `/api/widget` for at-a-glance progress. Total spend: $25. No Apple developer account.
- **v1 (once both are still engaged after ~6–8 weeks): Option 3, a hybrid with a native SwiftUI companion.** Pay the $99/yr. The companion does HealthKit sync (HAE becomes the fallback), widgets (including **interactive check-in buttons**, which cover the diet logging gap), a **Watch complication** showing today's fruit, and optionally a Live Activity during workouts. The game UI stays in the PWA, so we don't build it twice. Automate TestFlight uploads (Xcode Cloud or fastlane on the Mac mini, monthly) and set a reminder before the 90-day expiry.
- **Avoid Option 4.** Capacitor or Expo only pays off if you want one codebase for a full native UI. Widgets and complications still need Swift, and background HealthKit delivery is the part that most needs native code. If the team ever wants a fully native-feel UI, go straight to SwiftUI rather than a shell.
- **Go full native (Option 2 for everything)** only if the PWA feels too "webby" after real use. Port screen by screen; the server API stays the same.

---

## 5. Data model and rules engine

### Tables (SQLite, sketch)
```sql
users(id, name, timezone, avatar, created_at)
devices(id, user_id, kind /*hae|native|shortcut*/, token_hash, last_seen_at)

raw_payloads(id, user_id, source, received_at, headers_json, body_gz, parse_status)   -- 90-day retention

-- One row per user per local day per metric, UPSERTED (latest value wins)
daily_metrics(user_id, local_date, metric /*steps|exercise_min|stand_hours|active_kcal|sleep_min|water_ml|mindful_min*/,
              value REAL, source, updated_at,
              PRIMARY KEY (user_id, local_date, metric))

workouts(user_id, ext_id /*HAE v2 id or HK UUID*/, local_date, type, start_at, end_at,
         duration_s, active_kcal, distance_m, avg_hr, source, updated_at,
         PRIMARY KEY (user_id, ext_id))

checkins(id, user_id, local_date, habit_key, created_at, UNIQUE(user_id, local_date, habit_key))

goals(id, user_id, metric, target, period /*day|week*/, valid_from, valid_to)         -- personal, baseline-relative
rules(id, key, version, period /*day|week|month|season*/, params_json, amount_cents,
      bucket /*vacation|treats*/, active_from, active_to)                             -- never edited, only new versions

day_status(user_id, local_date, status /*open|provisional|settled*/, settled_at)

ledger_entries(id, user_id /*NULL = shared*/, bucket, amount_cents INTEGER,          -- +earn / -redeem / -transfer
               kind /*earn|topup|bonus|redeem|transfer|manual_adjust*/,
               idem_key TEXT UNIQUE,     -- e.g. 'earn:rule:exercise30@v2:u1:2026-11-14'
               rule_id, period_key, memo, created_at)

streaks(user_id, streak_key, current_len, best_len, last_date)                        -- derived, rebuildable
achievements(user_id, achievement_key, earned_at, UNIQUE(user_id, achievement_key))
rewards(id, name, cost_cents, bucket, icon)                                           -- "Ramen night", "Dessert date"
redemptions(id, reward_id, requested_by, approved_by, ledger_entry_id, created_at)
transfers(id, month, amount_cents, marked_done_by, done_at, ledger_entry_id)          -- real-world money moves
push_subscriptions(id, user_id, endpoint, keys_json, created_at)
```
Money is always **integer cents**. `streaks` is a cache that can be rebuilt. `ledger_entries` and `transfers` are the only sources of truth that can't be recreated.

### Ingest pipeline (idempotent by construction)
1. `POST /ingest/hae/:user`: auth token → save `raw_payloads` → parse with zod (accept both `{data:{…}}` and bare shapes [U]).
2. For each metric data point: convert `date` (which includes its offset) to the **user's local date** → `INSERT … ON CONFLICT DO UPDATE` into `daily_metrics`. Workouts upsert by `ext_id`.
3. Mark the affected dates "dirty" → re-evaluate **provisional** rules for those dates (only display state changes; no money moves).
4. Respond `200` quickly. Large payloads are processed in a transaction (a few ms with SQLite).

Re-sending the same payload 10 times gives the same state. That property is the whole point.

### Rules engine
- A rule is a **pure function** `(rule params, user's daily_metrics/workouts/checkins for the period) → amount_cents`. Examples: "≥30 exercise minutes → 50¢", "4 strength workouts this week → $3", "sleep ≥7h on 5 of 7 nights → $2", "close Move ring on 20 days this month → bonus $10". Pure functions mean unit-testable rules, with fixtures from real payloads.
- **Lifecycle of a day:** `open` (today, UI shows "pending shells") → `provisional` (yesterday; data may still arrive) → **`settled` at D+2 04:00 local**, when the nightly job writes ledger entries. Weekly rules settle on Wednesday 04:00 for the previous Mon–Sun week.
- **Writing money:** for each (rule, user, period), compute `amount`. Then `INSERT … ON CONFLICT(idem_key) DO NOTHING` with `idem_key = earn:<rule_key>@v<version>:<user>:<period_key>`. **Running the job twice cannot double-pay** because the database enforces it.
- **Late data after settlement:** a nightly **look-back job re-evaluates the last 14 days**. If `computed > already_paid` for a key, insert a `topup` entry for the difference with `idem_key = topup:<…>:<computed_amount>` (also idempotent). If `computed < paid`, **do nothing (no clawbacks)**. The data was real when we paid, and taking money back feels terrible. This makes the ledger monotonic and easy to reason about.
- **Rule changes:** never edit a rule; add a new version with `active_from`. Past periods keep their version. Recalculating history is an explicit admin action that writes `manual_adjust` entries with a memo.
- **Grace and fairness hooks** (product-owned): "sick day / vacation day" toggles set `day_status` to excused so streaks don't break. Per-person goals sit in `goals`, relative to each person's 2-week calibration baseline (see `docs/profiles.md`).
- **Shared vs individual:** each person's earnings are tagged with `user_id` but go into the **shared vacation bucket**. Couple bonuses ("both hit goal 5 days this week") are entries with `user_id NULL`.

### API surface (small)
`POST /ingest/hae/:user` · `POST /api/checkins` · `GET /api/summary` (also used by widgets) · `GET /api/day/:date` · `GET /api/ledger` · `POST /api/redemptions` · `POST /api/transfers/:month/done` · `POST /api/push/subscribe` · admin: `POST /api/admin/recompute?from=&to=` (dry-run by default; shows the diff before writing adjustments).

---

## 6. Money: virtual ledger vs real bank automation

| Approach | Safety | Effort | Verdict |
|---|---|---|---|
| **Virtual ledger + monthly Transfer Day** | High: no bank credentials anywhere | Trivial | **Recommended** |
| Virtual ledger + fixed recurring auto-transfer of the *maximum possible* amount, with the app tracking how much was "earned" | High | Trivial | Good alternative: money is saved either way, and unearned money could become a "next year" pot. Product/economy role to decide. |
| Bank APIs (Plaid, Teller, open banking) to move money automatically | Low: stores bank tokens on a home server; compliance and KYC | High | **Rejected.** It's overkill for 12 transfers a year and the charter calls it a non-goal. |

**Flow:** on the 1st of each month the server sends a push: "🐚 Transfer Day! You earned **$184.50** for the island fund in October." It deep-links to a screen showing the amount and one button, "I moved it". That records a `transfers` row plus a `transfer` ledger entry. Recommend a dedicated savings account or bank "bucket" called "Island Fund" so the real balance matches the app. Treats (eating out) are **redeemed in-app** from the treats bucket; the real money just gets spent on the date, and nothing needs transferring.

---

## 7. Phased build plan

### Phase 0: Spike (1 evening)
- Tailscale on server + both phones (Serve, VPN On Demand). HAE Premium Lifetime via Family Sharing. Point HAE at a catch-all endpoint and **save real payloads as fixtures**. Resolve the [U] items in the research doc's §6.

### Phase 1: MVP (≈3 weekends)
- SvelteKit + SQLite skeleton, Docker, Litestream backup.
- `/ingest/hae` with upsert into `daily_metrics` and `workouts`, plus a "last synced" indicator per person.
- 4–6 hard-coded starter rules (exercise minutes, workouts/week, sleep, stand, evening habit check-in) → settlement job → append-only ledger.
- PWA: Home (island + jar + today's fruit for both partners), Ledger, evening Check-in, Rewards (redeem treat), Transfer Day. Cute-but-simple styling from `docs/design/style-guide.md`.
- Web push: evening check-in reminder, "goal hit!" celebration, Transfer Day.
- Optional: Scriptable widget hitting `/api/widget`.
- **Exit criteria:** 2 weeks of calibration data flowing hands-off with ≤1 missed day per person; nobody has had to touch HAE.

### Phase 2: v1 (≈4–6 weekends, after 6–8 weeks of use)
- Rules become data (versioned table + admin page). Weekly, monthly and seasonal goals. Streaks with grace days. Achievements (badges, villager unlocks, island decorations).
- Baseline-relative goal adjustment (monthly review proposes new targets; both partners approve).
- **Native SwiftUI companion** ($99/yr, TestFlight): HealthKit anchored sync (HAE kept as fallback for 1 month, then optional), Home/Lock Screen widgets with **interactive habit check-in buttons**, Watch complication. CI uploads a TestFlight build monthly.
- Admin recompute with diff preview, data export (JSON/CSV of *our* DB) and a restore drill.

### Phase 3: Nice-to-haves
- Live Activity during workouts ("island is growing…"). Season events (holiday decorations), year-end recap "storybook". Photo meal diary gallery. Optional local-LLM meal-photo tagging (on the Mac mini, never a cloud API). Couple challenges. Apple Watch mini-app with a check-in button.

---

## 8. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| HAE runs irregularly (Low Power Mode, phone rarely unlocked) | Medium | Default range re-sends yesterday; settle at D+2; 14-day top-up look-back; v1 native companion |
| Tailscale tunnel down during a background POST | Medium | VPN On Demand Always; Funnel only for `/ingest` as a fallback; retries come for free on the next run |
| HAE abandoned or changes its format | Low-medium | Raw payload retention + zod schema tests; native companion in v1 removes the dependency |
| Double-paying from bugs or re-runs | Low | Unique `idem_key`, append-only ledger, no-clawback monotonic rule, dry-run recompute |
| Data loss (home server dies) | Low | Litestream + monthly restore test; metrics re-ingestible from Health |
| Losing interest | Medium | Product problem, but tech supports it with push celebrations, widgets and quick check-ins |

---

## 9. Open questions for the users
1. Is there an **always-on Mac mini or other home machine**, or should we plan for a Pi or a ~$5/mo VPS?
2. Are both partners in the **same Apple Family Sharing group**? (One $24.99 HAE purchase then covers both.)
3. Are you OK with **Tailscale running permanently** on both iPhones (VPN On Demand)? If not, we expose only the ingest endpoint publicly with a token.
4. Is **$99/yr for the Apple Developer Program** acceptable in v1, for widgets, Watch complications and dropping HAE? Or should we stay PWA-only?
5. Diet: OK with an **honor-system evening check-in** of 3–4 healthy habits? Does either of you already log food or water in an app that writes to Health?
6. Money: **monthly manual transfer of earned amount**, or **fixed auto-transfer of the max with in-app "earned" tracking**? Which bank account or bucket?
7. Does either phone often run in Low Power Mode or have Background App Refresh off?
