# 0017 — Rule changes for life without the Watch; rules versioned by week
**Status:** Accepted (round 4 fitness/nutrition review, user decision 2026-10-29 on manual minutes; versioning round 8). Amends [0009](0009-no-sleep-four-fruits.md) and [0014](0014-simplify-no-promises-no-cozy.md) (step days) and [0011](0011-mvp-rule-defaults.md) (active minutes). **Partly superseded:** §1 (step-derived minutes) by [0021](0021-activity-rings-no-check-ins.md), §2–4 and calibration by [0019](0019-bells-daily-earning-two-pots.md). Rule versioning by week stands (`RULES` in rules.ts). Values: `app/src/lib/config/rules.ts`.

**Context.** A scored his own 4 weeks of iPhone-only data (steps on 31/31 days, median 7,579; exercise minutes on only 3 days). Without these changes his best week was 70 fruit, 45 with no gym visit, and the Treat Purse needs 60. Real scores were 30, 17, 14, 14 (Pear excluded).

## Decision
1. **Active minutes come from steps too.** A day's minutes = **max(Watch exercise minutes, (steps − step goal) / 100, workouts added by hand in きろく)**, then the daily cap `min(90, max(60, ½ weekly target))`. 100 steps/min is a moderate walking cadence; steps under the goal count as incidental. It is a `max`, never a sum, so nothing counts twice (`STEP_MINUTES`, `activeMilliOfDay`). On A's data: Peach 35 / 26.7 / 29.2 / 21.0 instead of 15 / 5.9 / 5 / 5.
2. **Step goal on 4 of 7 days** (was 5): A 7,500, B 6,250 in Season 1 (`stepDaysPerWeek: 4`). A met 5 of 7 in 1 of 4 weeks, and 4 of 7 in 2 of 4. Season 2 adds +500 steps or +1 day. B's goal becomes her calibration median, rounded to 250.
3. **Peach targets:** A stays at 135 min/week; B 85, then her calibration value × 1.1.
4. **Calibration weeks are the weeks of Mon 2026-11-02 and Mon 2026-11-09** (`CALIBRATION_WEEKS`): a flat 60 fruit per person with Health data on ≥ 6 of 7 days, otherwise 0. Use those two weeks to check items 2 and 3 against real data.
5. **Gym visits are A's strength signal.** A visit ≥ 30 min that the person confirms (one tap) is a strength day, at most **2 confirmed visits paid per week** (`maxConfirmedVisitsPerWeek`). "Wear the Watch at the gym" is a hint, never a rule.
6. **Any visit ≥ 30 min is a busy day**, confirmed or not, so it is never a rest day.
7. **Rules are versioned by week.** Payouts are computed on read from the rows, so editing a value in place would re-price every past week, including weeks already moved to savings. So:
   - **Money and points** live in `RULES`, a list of `{from, money, points}` versions in ascending `from` (a Monday week key). `rulesFor(week)` picks the version in force; weeks before the first version use it. Version 1 starts 2026-11-02 (¥50/fruit, ¥20 team, ¥1,000 purse at ≥ 60; points 30 + 5 / 25 / 15 / 25).
   - **Targets** are versioned the same way by `SEASONS` (`from` date).
   - `MONEY` keeps only what prices no week: the both-OK spend threshold (¥5,000) and payday (the 25th).
   - **To change a rate or target:** append a version (or season) with a later `from`, ideally a future season start; never edit one whose weeks have paid. `rules.test.ts` pins the paid versions, and a new version re-prices only weeks from its `from`.
   - **Not versioned:** the scoring mechanics (`STEP_MINUTES`, `PEACH_DAILY_CAP`, `STRENGTH`, `REST`, `DAILY`, `CALIBRATION`, `TSUYU`, `HOLIDAY`, `CUTOFFS`). Changing one of these still re-prices history, so treat them as fixed, or move the one you need to change into `RULES` first.

## Not adopted
- **Excused weeks** (W3: up to 2 sick or travel weeks per season paid at ≥ 60) are not built. A sick week just scores lower ([0014](0014-simplify-no-promises-no-cozy.md)); pause weeks (v1) remain the way back.
- The 「iPhone持ってた？」 prompt for days under 500 steps (W8) and a low-week "rest when ill" host line (W9) are not built.

## Consequences
- Without the Watch, A's realistic week is about 60–85 instead of 30–45. With the Watch, nothing changes (the `max`).
- Changing a rate or target is a code change plus a redeploy (push to main), not a tuning knob. Old versions stay in `rules.ts` for as long as their weeks exist.
- After Season 1, check that Pear is ≤ 30% of A's median score.
- The round-4 review that proposed items 1–6 is in git history (`docs/reviews/round-4/fitness-nutrition.md`).
