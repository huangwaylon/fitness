# Round 1 Review: Software Engineer

Reviewed: fitness-coach, nutritionist, motivational-coach, ui-ux-designer, manager-lead memos; style guide; mockup (+preview); profiles.
Lens: can we build it, does Health Auto Export (HAE) give us the data, and how big does the rules engine get. Legend: [V] verified in my research, [U] unverified.

## 1. What I endorse

- **Weekly settlement, linear partial credit, weekly caps** (all memos). That's what our late-arriving iOS data needs. Weekly targets absorb the "phone was locked until morning" lag.
- **No calories, Move ring, or weight in scoring** (fitness, nutrition). Calorie data is also the noisiest data we get. Minutes, days, workouts, and sleep hours are all in HAE's metric/workout export [V].
- **Points only go up; no penalties** (nutrition). This matches my no-clawback ledger rule, so the ledger stays monotonic.
- **Append-only, auditable ledger; config changes apply at the next week boundary** (motivational §9). This is exactly my versioned-rules design.
- **Pre-funded "locker" + monthly manual transfer, no bank APIs** (motivational §2.3, lead non-goals). It's simpler than my "transfer what you earned". The money is already saved and the app just tracks how much has unlocked. I'll adopt it.
- **Joint-workout detection by time overlap** (fitness §5.1). HAE v2 workouts have `start`, `end`, and `id` [V], so this is a cheap query.
- **48 h backfill and partner co-logging for check-ins** (nutrition §2). These fit the D+2 settle window as-is.
- **Designer's mobile-first PWA stance, safe areas, and native-only widget section.** These match my MVP-PWA, v1-companion plan exactly.

## 2. Conflicts and concerns (with fixes)

| # | Issue | Fix |
|---|---|---|
| E1 | **Motivational pays the Move ring (2 Miles/day)**, but fitness and nutrition forbid paying for calories. | Drop the Move ring from money. Show it as a badge only. |
| E2 | **Three "rest" mechanisms:** coach pro-rates targets (×(7−n)/7), motivational credits Cozy Days as 12 Miles and rolls Pause money forward, nutrition has a "life happens" freeze. | **One `excused_days` table, two kinds.** *Rest/sick day* pro-rates every weekly target. *Pause week* removes the week and spreads its money over the remaining weeks. Delete the "credit 12 Miles" rule. |
| E3 | **Economy feature load** (overflow → Lost & Found reclaim → Stretch Fund, Comeback +20%, Fresh Start double overflow, Buddy +50% Miles, partner approval of manual workouts before Bells). Each is a stateful rule with interactions that make the ledger hard to reason about and test. | v1 = per-category weekly ratios → unlock % → jar. Defer everything in this row to v2, after we have real data (see C2). |
| E4 | **Coach's calibration rule "Watch worn ≥ 20 h/day"**: HAE doesn't export wear time. We'd have to infer it from raw heart-rate samples, which means huge payloads. | Pay calibration weeks a flat 60%, conditional only on data arriving. |
| E5 | **Baseline from 8–12 weeks of history** (coach) / 4–8 weeks (motivational). REST automations offer at most "Previous 7 Days" [V]. | One-time onboarding step: HAE **Manual Export** with a custom date range to our endpoint. This happens once at setup, not ongoing, so it doesn't break "no manual import" in spirit. Lead to confirm. |
| E6 | **Manual-entry flagging** (`HKMetadataKeyWasUserEntered`, motivational §7.1; coach §2). It isn't clear HAE exposes this, and aggregated metrics certainly don't [U]. | v1: trust plus visibility (show workout source). Revisit with the native companion, which reads the metadata directly. |
| E7 | **Strength detection by activity type.** HAE gives the workout `name` string ("Traditional Strength Training"…), not the HK enum [U on exact strings]. | Build a name→category mapping table from fixtures. The "Was this strength?" prompt (coach) needs a per-type preference table plus one UI sheet. That's fine. |
| E8 | **Recovery rule "no workout > 20 min at high HR"** needs a definition of "high". | Use workout `avgHeartRate` ≥ 77% of the age-predicted max (coach §6.2), available in v2 workouts [V]. Or drop it from money (I prefer dropping it, see C1). |
| E9 | **Designer: per-meal tiles (Healthy / Balanced / Treat)** don't match the nutritionist's habit list, and 4×/day breaks the ≤10 s budget. | See C3. |
| E10 | **Designer: "Refreshed 2 min ago" and pull-to-refresh** suggest live sync. Pull only re-reads our server; iOS decides when HAE runs [V]. | Copy should say "Synced 40 min ago". Add a **"Sync now"** button that opens HAE's deep-link automation [U: verify the deep-link URL scheme], so an unlocked phone pushes immediately. |
| E11 | **Actions on notifications** ("action buttons directly on the notification", designer §7.4). I believe iOS web push has no action buttons [U]. | Tapping the notification deep-links into the check-in sheet. Native companion later. |
| E12 | **"Both tap Drop it in the jar"** must not gate the money. | The ledger is written by the server at settlement; the tap is ceremony only (it records `acknowledged_at`). |
| E13 | **Designer "fix gaps (Watch was charging)"**: hand-edited metrics. | Partner-visible `metric_overrides` rows with a reason. Never mutate ingested data. |
| E14 | **Settlement timing:** motivational says Sun 20:00, designer Sun 19:30, coach "close Monday noon", mine D+2. | See C5. |

## 3. Gaps

- **No single weekly scoring spec.** Every rule should be one generic type so the engine is a single function: `points = weight × clamp((actual/target − floor)/(1 − floor), 0, 1)` with per-category `{metric, target, floor, weight, daily_cap}`. Every row in the coach and nutrition tables except couple bonuses fits it.
- **Who owns target changes:** the coach's adaptive advance/hold/step-back vs motivational's "never auto-raise, suggest only". Engineering assumes *suggest + accept*. Targets get versioned rows (`goals.valid_from`) so history scores against the target in force at the time.
- **Time zones and travel:** coach "travel mode by time-zone change". HAE timestamps carry offsets [V], so this is detectable. We need a rule: a day belongs to the local date where the sample happened.
- **Alcohol/water auto-read:** HAE lists Dietary Water [V]. `numberOfAlcoholicBeverages` isn't in HAE's list as I read it [U]. Treat alcohol-free day as a check-in until confirmed.
- **Cycle data** (coach §4.1, opt-in gentle-day suggestion). HAE exports cycle tracking [V], but this is the most sensitive data in the app. **v2 at the earliest, and only on the owner's own phone/automation.** I suggest it never goes to the server.
- **Year-end, rule-change, and data-loss procedures:** need a written "recompute with diff preview" admin flow (in my memo) and an agreed owner.
- **Nobody specified the treat-jar overspend case** (jar balance < ticket price). I propose disallowing it, with no debt.

## 4. Positions on lead conflict points

**C1 One scoring model.** 100 points per person per week across **5 categories = 5 fruits**, each using the generic ratio rule above: **Exercise minutes 30 · Strength days 20 · Sleep nights 15 · Steps days 10 · Eats 25** (nutrition share 25%, the low end of the nutritionist's 25–35%). Stand, recovery, active-days, Move ring, and VO2 become badges/cosmetics only. Unlock % = `min(1, points/85)`, as in the motivational model. Couple bonuses stay outside the 100 in the Together line. That's 5 rule rows per person per week. Trivial to test.

**C2 Economy concepts.** Three: **Fruit** (weekly points, never money) → **Vacation Jar** (real $, unlocks Sunday) and **Treat Wallet** (real $, spent in the Shop). One sentence: *"Your healthy week grows fruit, and each Sunday your fruit unlocks real dollars into the Vacation Jar and the Treat Wallet."* Together Bonus = a line on the jar receipt, not a concept. Unearned money simply **stays in the Locker** (the savings account). Its year-end destination is one setting, so no Lost & Found, Rainy Day, Stretch, or Miles in v1.

**C3 Eating check-in.** **One evening card** (≈20:00 push) with the 3–4 habit toggles from the nutritionist, auto-saves, 48 h backfill, partner can co-log shared meals. The same card is reachable any time from Home and, later, as widget buttons. Drop per-meal tiles. A "Treat meal" chip stays as a no-penalty honesty log.

**C4 Fruit ↔ category 1:1.** Add a fifth fruit for strength, e.g. **coconut** (hard shell = strong, very island). Apple = steps, peach = exercise minutes, coconut = strength, plum = sleep, pear = eats. Strength is weekly (2 days), so the coconut slot shows "1/2 this week" rather than a daily slot. Category key = fruit key = rule key in the code.

**C5 Settlement timing.** **Settle provisionally at the Sunday ceremony and top up later.** At 19:30 we write `earn` entries from the data we have, then the Wednesday 04:00 final pass writes `topup` deltas only, never clawbacks. Late Sunday activity and late watch syncs appear at the next ceremony as "late-arriving fruit +$1.20". The ceremony keeps its emotional timing, and idempotency keys guarantee nothing is paid twice.

**C6 Treats.** **Separate Treat Wallet with its own budget** (e.g. $50/mo), unlocked by the couple's average unlock %. Treats never debit the jar. That's a separate ledger bucket, which is simpler and kinder.

**C7 Partner visibility.** Default: the partner sees **fruit / % of own goal**, not raw numbers. Each person can opt in to share raw values per metric. Sleep and eating check-in details are private by default. **Enforced server-side** (the API strips hidden fields), not just hidden in the UI.

**C8 Daily dollars.** **No per-day "$" chips.** Unlock is capped at 85 points, so daily dollars would be misleading. Show fruit and points daily, plus on the Fund tab one line: "This week so far: ≈ $41 of $57 (unlocks Sunday)". Real $ appears at the ceremony. The mockup's "+$3" and "perfect day +bonus $" should become fruit/points.
