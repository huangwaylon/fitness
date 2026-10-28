# Round 2 Sign-off: Fitness Coach

**Reviewed:** `docs/PROPOSAL.md` v1.0 and ADRs 0001–0005.
**Overall:** the plan matches my memo closely. The 12-month arc in §2.3 matches my §6.5–6.6 numbers. The five-fruit weights are acceptable, and easy/recovery weeks, ceilings, PAR-Q+, and "Move ring / HRV / VO2 max never paid" are all in. Three items below are blocking.

## (a) BLOCKING

**B1. Strength-day definition counts yoga and HIIT automatically** (PROPOSAL §3.2 Coconut row; ADR 0002 table).
Most yoga and many HIIT classes don't meet the guideline's "muscle-strengthening activity that works all major muscle groups." If they count automatically, Partner B's bone plan can be "met" without any loading.
*Exact fix:* replace "Strength days (strength, HIIT, yoga/pilates ≥ 20 min)" with:
> "Strength days: a Traditional/Functional Strength, Core Training or Pilates workout ≥ 15 min (auto). HIIT, Cross Training, Yoga, Climbing or Barre count after a one-time 'Did this include strength work?' tap, which is remembered per workout type and app. Max 1 per day."

Make the matching change in ADR 0002 ("strength/HIIT/yoga workout ≥ 20 min").

**B2. A daily cap of 90 active minutes is too loose at low targets** (ADR 0002 "Daily caps"; PROPOSAL §2.1.4).
At B's Season 1 target of 85 min/wk, one 90-minute day fills the whole week's peach. That rewards "weekend warrior" binges, the classic injury pattern for beginners, and contradicts my plan's cap.
*Exact fix:* "Active minutes counted per day = min(90, max(60, 50% of the weekly target))." So B gets 60/day in Season 1 and A gets 90 once his target is 180+.

**B3. Pause has no safe return, and long illness or injury hits a hard limit** (ADR 0004; PROPOSAL §3.7).
After "up to 2 weeks per season" of paused weeks, an injured or ill person is scored against full targets. That pushes them to train while injured, and nothing ramps them back in after a pause.
*Exact fix:* add to §3.7 and ADR 0004:
> "Paused weeks beyond 2 per season are excluded: no pay, no penalty, no streak break, and progression is frozen. The first week back after a pause, or after 3+ Cozy Days in a row, uses targets ×0.8 (×0.7 after more than 2 weeks away) and pays in full if met."

## (b) Non-blocking suggestions
1. **Define the recovery hint as OR, not AND** (§3.7 currently needs an RHR spike *and* an HRV dip *and* poor sleep). An elevated resting HR alone is the most reliable early illness sign. Suggest: "resting HR ≥ 7 bpm above its 30-day baseline for 2+ days, OR HRV below baseline − 1 SD for 3 days, OR < 6 h sleep 3 nights in a row → Juniper suggests a Cozy Day." Also add a load nudge: "6 days in a row with ≥ 30 active min, or a week over 1.3× the 4-week average → suggest a rest day." No pay effect.
2. **Define "rest day"** for the 3-fruit moon-plum slot. The engine needs a rule: "a day with no workout ≥ 45 min and no workout ≥ 20 min with avg HR ≥ 77% of estimated max HR. Walking and mobility are fine. Cozy Days count."
3. **Adaptive progression wording** (§2.3): say block advances are **pre-filled suggestions the person accepts with one tap** (the motivational coach's "never auto-raise" rule). Step-backs can be automatic. For anyone already at or above 150 min, raises happen only at season start (+5–8%).
4. **Define "together" overlap** (§3.8, ADR 0002): "overlap ≥ 20 min and ≥ 70% of the shorter workout, with starts within 15 min." "≥ 70%" alone doesn't say 70% of what.
5. **Missing Watch data:** a day with Watch steps < 500 and 0 stand hours (charging, or forgot the Watch) should auto-count as a Cozy Day (max 2 per month) instead of counting as "did nothing."
6. **Calibration pay** (§2.2): "flat participation rate" needs a rule the data can check. Suggest "Health data present on ≥ 12 of 14 days" (there's no wear-time metric in HAE).
7. **Safety copy:** add the stop signs (chest pain, fainting, unusual breathlessness, sharp joint pain) to onboarding and help, next to PAR-Q+.
8. **Jump progression** (§2.3): "10 → 60 landings" should say "per session, 2–3 days/wk, with a strength-training base first (Season 2+ for > 20)." Pause it if pregnant or if joint pain appears.
9. **Moon-plum split 12 + 3** vs. my 10 + 5: acceptable, no change needed.

## (c) Sign-off
**Yes, conditional on B1–B3.** These are three one-line text fixes, and none changes the economy math or the architecture. With them applied, I sign off on the fitness side of Proposal v1.0.
