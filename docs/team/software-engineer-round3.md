# Software Engineer: Round 3 (Japan, yen, gym detection, simplification)

Responds to ADR 0006. Legend: **[V]** verified this round (source cited, or run locally) · **[U]** unverified.

## 1. Automatic "gym visit" detection (backup for a forgotten Watch workout)

**What each source can do**

| Source | Finding | Usable? |
|---|---|---|
| **Shortcuts: Arrive / Leave automation** | Arrive and Leave are among the triggers that "can run without asking you for confirmation" [V] ([Apple: Add automations](https://support.apple.com/guide/shortcuts/add-automations-apdfbdbd7123/ios)). There's a per-shortcut **Privacy → "Allow Running When Locked"** setting, and the automation then "will not notify you when it's triggered" [V] (same page). Automations are per-device and sync to other devices *turned off* [V] ([Intro to automation](https://support.apple.com/guide/shortcuts/intro-to-automation-shortcuts-apd690170742/ios)). The exact iOS version where location triggers became runnable without confirmation, the geofence radius, and arrival latency are not on Apple's page [U]. | **Yes: primary backup** |
| **Shortcuts: "Get Contents of URL"** | Supports **POST** with a JSON **Request Body** [V] ([Apple: Request your first API](https://support.apple.com/guide/shortcuts/request-your-first-api-apd58d46713f/ios)). A Headers field for the bearer token isn't documented on that page [U, but I'm fairly sure it exists]. Unlike Health reads, an arrive/leave POST needs **no HealthKit access**, so the locked-phone problem doesn't apply. It only needs the Tailscale tunnel up (VPN On Demand) [U: test in Phase 0]. | Yes |
| **Shortcuts: "Apple Watch Workout" trigger** | Listed as auto-runnable [V], but it only fires when a workout *is* started, which is the opposite of our problem. | No |
| **Shortcuts: "Transaction" trigger** (Wallet) | Anytime Fitness Japan entry uses a **Wallet access pass** (one device per pass) [V] ([AF Japan FAQ](https://www.anytimefitness.co.jp/faq/), [app page](https://www.anytimefitness.co.jp/lp-app/)). Whether tapping an access pass fires the Transaction trigger is **[U]**; I believe it only covers payment cards. Worth a 2-minute test at the gym in Phase 0, because it would be a perfect signal. | Test only |
| **Anytime Fitness Japan app** | Digital access pass, activity logging, Apple Fitness+ benefit. **No visit history, no export, no API, no Apple Health sync mentioned** [V] (lp-app + FAQ). The crowd counter is gym-wide, not personal [V]. | No |
| **Health Auto Export** | Workouts carry `location` (Indoor/Outdoor) and `isIndoor`; `route` only when there is GPS data [V] (HAE workout format). HAE has no location or geofence feature that I found [U]. | No |
| **HealthKit workout route** | `HKWorkoutRoute` = CLLocation series attached to a workout [V] ([Apple](https://developer.apple.com/documentation/healthkit/hkworkoutroute)). It exists only if a workout was recorded, and indoor strength workouts don't record GPS [U]. | No |

**Recommendation.** Per person, set up one Shortcuts automation pair for **their gym** (the Anytime branch; the trainer's studio for the PT partner): *Arrive → POST `/api/presence {place, event:"arrive"}`*, *Leave → POST `{event:"leave"}`*, run automatically, allowed when locked. Setup takes about 3 minutes per phone, once. The server pairs arrive→leave into a **visit** if dwell is ≥ 30 min, which filters out walking past or using the konbini downstairs. That matters in dense Tokyo buildings.

**Fallback prompt flow (never auto-pay a visit without a tap):**
1. When a visit closes and **no Watch workout overlaps it**, send a web push ~10 min after Leave: *"Juniper saw you at Anytime 7:02–8:10 🏋️ Count it as a strength day?"* Tapping opens a sheet with **[Strength ✓] [Cardio] [Just visiting]**. iOS web push has no inline action buttons [U], so the tap opens the app.
2. "Strength" creates a `workout` row with `source='visit_confirmed'`. It grants the **coconut (strength day)** only. Active minutes still come from the Watch's own exercise minutes, so we never invent minutes. The partner sees a small "📍 confirmed visit" tag (trust + visibility).
3. If the geofence also fails (no visit, no workout): the **evening check-in card** shows one extra chip, *"Trained today (PT / gym)?"*, but only on days with no strength workout. The **Sunday ceremony** has a "Anything we missed this week?" row (also inside the D+2 window, before Wednesday 04:00).
4. PT sessions: the trainer partner should ideally still start a Watch "Strength" workout. The same visit flow covers forgetting.

## 2. Yen handling

- **Integers only.** `amount_yen INTEGER`. Fruit is stored as **integer milli-fruit** (57.3 → 57300), so payouts never touch floats:
  `personal = floor(4000 × min(s, 85000) / 85000)`, `team = floor(2000 × min(rA', rB'))`, computed with integers as `floor(2000 × min(sA,85000,…) / 85000)`, where a paused partner = 85000.
  Floor **per ledger entry**. The remainder is simply never written, so it stays in savings. The shortfall bank uses the same integer math (`S += 4000 − paid`; recovery floored).
- **Treat purse:** ¥1,000 per person per week at ≥ 60 gives a max of ¥104,000/yr, versus "¥8,000/month" = ¥96,000. **Fix the ADR wording** to "≈ ¥8,000–8,700/month (max ¥2,000/week)", or change it to ¥1,000/person only in weeks ≥ 60, capped at ¥8,000 per calendar month.
- **Time zone:** person default `Asia/Tokyo` (UTC+9, **no DST**), so day boundaries are simple. Store UTC; derive `local_date` from the HAE timestamp's own offset (which handles travel) [V: offsets are in the payload]. Weeks = Mon–Sun in JST. Run the scheduler with an explicit zone, so the server's OS time zone doesn't matter: **Sunday 19:30 JST** provisional, **Wednesday 04:00 JST** final + lock. Check: `2026-11-01T15:30Z` → `2026-11-02` in Tokyo [V, run locally in Node 26].
- **Formatting** [V, run locally]: `new Intl.NumberFormat('ja-JP',{style:'currency',currency:'JPY'})` → **"￥128,000"** with a **full-width ￥ (U+FFE5)** and 0 decimals. `en-US` + JPY → "¥128,000" (half-width). `currencyDisplay:'name'` with ja-JP → "128,000円". **Pick one** for the design: half-width "¥" suits Fredoka; "円" suits Japanese UI. Put it in one `formatYen()` helper.

## 3. Data model changes from 0006

```sql
-- DROP: ticket, redemption(ticket-based)
ledger_entry(id, bucket TEXT CHECK(bucket IN ('trip','treat_purse')),
             layer TEXT NULL CHECK(layer IN ('A','B','team')),   -- trip only
             person_id NULL, amount_yen INTEGER,                  -- +earn / −spend
             kind TEXT CHECK(kind IN ('earn','topup','recover','spend','adjust')),
             week_key TEXT, idem_key TEXT UNIQUE, shop_item_id NULL, approved_by NULL, memo, created_at)
shop_item(id, name, price_yen INTEGER, needs_both BOOL)           -- e.g. 焼肉 ¥8,000
promise(id, person_id, week_key, days_mask INTEGER /*Mon=1…Sun=64*/, kind TEXT /*gym|pt|walk|any*/,
        note TEXT NULL, kept BOOL NULL, bonus_fruit INTEGER CHECK(bonus_fruit BETWEEN 0 AND 5),
        UNIQUE(person_id, week_key))
place(key, person_id, name, kind)  ·  presence_event(person_id, place_key, event, at)  -- visits derived
```
- **Promises are structured** (pick days + kind, optional note) so the server can **auto-judge** them against workouts and confirmed visits. Free text can't be scored. The bonus is added inside the cap: `score = min(100, categories + bonus)`.
- **Purse spend** = a negative `treat_purse` entry, which needs `approved_by` when `needs_both`. Reject the spend if the balance would go below 0.
- **Jar layers query** (the whole Jar screen):
```sql
SELECT bucket, layer, SUM(amount_yen) AS yen FROM ledger_entry GROUP BY bucket, layer;
-- → trip/A 128000 · trip/B 121500 · trip/team 58000 · treat_purse/NULL 6500
```

## 4. Simplification: cut from the MVP

| Cut / defer | Replace with |
|---|---|
| Rules-as-data admin UI, recompute-diff UI | Rules in a TS config file + a `pnpm recompute --dry-run` CLI |
| Passkey login | **Tailscale identity** from Serve (who-is-calling header) [U: verify header] → zero login |
| Metric override editor | The Sunday "anything we missed?" row + visit confirmation |
| Adaptive progression engine | Targets typed into config at each season start (4×/yr) |
| Museum, collectibles, seasonal events, streak freezes | Phase 3 |
| Separate Transfer Day screen | One monthly push + a "Moved ✓" button on the Jar page |
| Pause weeks (trailing-4-week pay) | Cozy Days only in MVP |
| Scriptable widget | Optional, after MVP |

**MVP endpoints (9):** `POST /ingest/hae/:person` · `POST /api/presence` · `GET /api/week` (one payload for Home + Jar) · `POST /api/checkin` · `POST /api/cozy-day` · `POST /api/promise` · `POST /api/purse/spend` · `POST /api/transfer/done` · `POST /api/push/subscribe`.
**MVP pages (3 + 1 overlay):** Home (island, this week's fruit, check-in button) · Jar (layers, purse, shop list) · Settings · **Sunday overlay** (tally + promise).

## 5. Hosting from Japan
- **Home internet:** many Japanese fiber lines give IPv4 through IPv6 tunnels (MAP-E / DS-Lite), which means **no inbound port forwarding** [U]. That's another reason for Tailscale, which needs none and handles NAT traversal [U]. Tailscale relays exist in Asia [U]; latency within Japan is negligible.
- **Earthquake / power:** the server is the single source of the ledger. (1) A small UPS + macOS "start up automatically after a power failure" (`pmset autorestart 1`) [U]. (2) Off-site, client-side-encrypted backups in a **different region** from the home (e.g. a Cloudflare R2 or Backblaze bucket outside the Kantō area) [U on region options]. (3) A monthly restore drill (already planned). (4) Health metrics can be re-sent from the phones (a 12-week manual export), so the ledger + promises + check-ins are the only irreplaceable data, and they're tiny.
- **Summer heat:** a Raspberry Pi throttles in a hot Japanese apartment, so give it a case with a fan, or prefer the Mac mini.
- **Privacy law:** private use for two people is very likely outside APPI business obligations [U, not legal advice]. Nothing changes in the design.
