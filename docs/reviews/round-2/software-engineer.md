# Round 2 Sign-off: Software Engineer

Scope: `docs/PROPOSAL.md` and `docs/decisions/0001`–`0005`, checked for feasibility, data availability, payout math, and the ledger/settlement logic.

## (a) Blocking issues (each with an exact fix)

**B1. The HAE history backfill is described wrongly** (PROPOSAL §2.2 "the server backfills ~12 weeks"; ADR 0001 "either through HAE's date-range export or the first automation run").
The server can't pull from HAE; HAE only pushes. REST automations offer at most a **"Previous 7 Days"** range (Default / Since Last Sync / Today / Yesterday / Previous 7 Days, per the HAE REST docs). So the first automation run **cannot** deliver 12 weeks. Only a **Manual Export** with a custom date range, sent to the REST endpoint, can (HAE docs: "Manual Export: choose a date range and tap Export").
*Fix (ADR 0001 Baseline bullet):* "Baseline: at onboarding each partner runs **one HAE Manual Export** (last ~12 weeks, JSON v2, aggregated metrics + workouts, batching on) to `/ingest/hae`. It's about a 1-minute, one-time action per phone. Phase 0 verifies it." *Fix (PROPOSAL §2.2):* "At setup each of you taps one export in Health Auto Export that sends ~12 weeks of history (one time only)."

**B2. "Extra fruit recovers earlier shortfalls" has no definition**, and it interacts with provisional pay and top-ups (ADR 0002/0003, PROPOSAL §3.2). Without a definition it can't be built idempotently, and it's ambiguous whether surplus banks *forward* (which the text forbids) and whether it touches the Team share.
*Fix (add to ADR 0003 §4):* "Per person, keep a running **shortfall bank** `S`. Each week: `paid_ratio = min(score,85)/85`; `S += (1 − paid_ratio) × personal_weekly`; `recovery = min(S, max(0, score − 85)/85 × personal_weekly)`; `S −= recovery`. Recovery applies to **personal shares only**, never the Team share. Surplus with `S = 0` is cosmetic. It's computed sequentially from week 1 in the deterministic recompute; ledger key `recover:<person>:<week>`." That keeps "extra fruit only looks backwards", and the ≥85 → $3,000 row still holds.

**B3. The provisional/top-up logic needs an edit cutoff.** The 48 h check-in backfill after Sunday ends Tuesday 24:00, which is fine for Wednesday 04:00. But **Cozy Days marked retroactively** (or HAE data arriving after Wednesday) aren't covered.
*Fix (ADR 0003 §5):* "Sunday 19:30 writes `earn:<rule>:<person>:<week>` from the data on hand. **Wednesday 04:00 is the final pass**: it recomputes the week and writes `topup:<…>:<week>` = max(0, final − provisional). After that the week is **locked**. Cozy Days, check-ins and metric fixes for a locked week are rejected (the UI says so). Data that changes downward never claws back." Also state that Sunday's own D+2 is Tuesday, so Wednesday 04:00 satisfies D+2 for every day of the week.

**B4. Privacy claim** (PROPOSAL §4.1 "Health data never leaves your hardware") contradicts the Litestream-to-object-storage backups.
*Fix:* "Health data is stored only on your home server, plus **client-side-encrypted** off-site backups." Implementation note: restic, or Litestream with age encryption [U: verify the Litestream version supports age].

**B5. The data model (§4.3) is missing tables** that the agreed features need: privacy enforcement, ticket approval, pause weeks, Transfer Day, habit choice.
*Fix (append to §4.3 table list):* `visibility_pref(person, metric, share_raw BOOL)` · `cozy_day(person, day, kind ∈ {cozy, pause})` (pause weeks pay the trailing 4-week %) · `redemption(…, requested_by, approved_by NULL)` (the 4+ ticket rule) · `transfer(month, amount, done_by, done_at)` · `habit_choice(person, season, habit_key ×3)` · `device_token(person, hash)` · `push_subscription` · `ceremony_ack(week, person)` (ceremony only, never gates the ledger). The `ticket` table should be a ledger bucket (`bucket='tickets'`, unit = 1 ticket) so tickets get the same idempotency guarantees.

## (b) Non-blocking suggestions
1. **Payout math checks out:** $3,000/52 = $57.69; 42.5% = $24.52; 15% = $8.65; 75/85 × $3,000 = $2,647; 60 → $2,118; 40 → $1,412. Tickets: 52 × $11.54 ≈ $600/yr = $50/mo. ✓ Suggest adding "assumes a steady weekly score; real weeks vary, and the shortfall bank (B2) partly smooths this".
2. **Prorating for Cozy Days** needs a rounding rule for day-count targets (5 of 7 × 6/7 = 4.29). Use the fraction directly in the linear ratio, with no rounding.
3. **Define a "rest day"** (Moon-plum, 3 pts) concretely: "no workout ≥ 20 min with avg HR ≥ 77% of the age-predicted max". HAE v2 workouts include avg HR.
4. **Daily active-minute cap:** ADR 0002 says 90 min; the coach memo says max(60, 50% of target). Pick one in ADR 0002 (90 is fine and simpler).
5. **Transfer Day** covers ledger entries *created* in the previous calendar month, including Wednesday top-ups, so weeks that straddle months are never double-counted.
6. **Workout-type mapping:** HAE sends a workout `name` string, so we need a name→category table built from Phase 0 fixtures (exact strings [U]).
7. **The Phase 0 spike should also measure** the delay between activity and its arrival on the server, and how Tailscale VPN On Demand drops affect HAE runs. If failures are frequent, fall back to a Funnel exposing `/ingest` only.

## (c) Sign-off
**Yes, conditional on B1–B5.** All five are wording or spec additions; none changes the architecture, the economy or the scope. Once they're applied I'm happy for the build to start on Phase 0.
