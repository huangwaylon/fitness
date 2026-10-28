# Round 4 review: fitness coach + nutritionist (simplified rules, no Watch)

**Scope:** `rules.ts`, `scoring/*`, ADRs 0008–0014, profiles, and A's real data. I scored A's 4 full weeks with `scoreWeek`, Pear left out.

**Real data:** steps on 31/31 days: median 7,579, p25 3,996, p75 9,678. Exercise minutes are > 0 on only 3 days (the iPhone alone doesn't log them). **Scores today, excluding Pear: 30, 17, 14, 14.**

**Round 3:** the rest rule with ≥ 45 min, the visit cap, the 正月 reminder skip and the habit copy have landed. F1/F3/F4 no longer apply.

| ID | Sev | What | Evidence | Fix (numbers) |
|---|---|---|---|---|
| W1 | **Blocking** | **Peach (35) can't be reached without the Watch.** A's best possible week is 70, or 45 with no gym visits. The Purse needs 60. | Sim: Peach 15/5.9/5/5 | **Count purposeful walking as active minutes:** `dayMin = max(exerciseMin, max(0, steps − stepGoal) / 100)`, then the existing daily cap. 100 steps/min is the moderate-intensity cadence, and steps under the person's goal count as incidental. The `max` means a Watch day is never counted twice. Sim: 220/98/109/72 min, so Peach 35/26.7/29.2/21.0. |
| W2 | Should | **Use gym visits as A's strength signal.** An iPhone-only Strength workout is [U]. Arrive/Leave is built, but `presence_event` holds 0 rows. | `anytime` (A) is confirm-required. Sim: +25/week | Keep the one-tap confirm, ≥ 30 min, cap 2/week. Phase 0 exit: ≥ 4 real visits paired. "Wear the Watch at the gym" is a hint, never a rule. |
| W3 | Should | **A sick, injured or travel week costs about ¥4–5k and cuts the partner's team bonus**, which rewards training while ill. Weekly slack covers 1–2 bad days (period, a cold), not a full week. | No excused days; `payout.ts:16` uses `min(a, b)` | A rule-level cap, not a feature: `EXCUSED_WEEKS: { A: [], B: [] }` paid at `max(score, 60)`, **≤ 2 per person per season**, edited by hand, no UI. |
| W4 | Should | **The S1 step target is a coin flip for A:** 7,500 on 5 of 7 days was met in 1 of 4 weeks (6/4/3/3 days). | Days ≥ 7,500: 16/31 | A: **7,500 × 4 days** (met 2 of 4 weeks). B: 6,250 × 4 as a placeholder, then her calibration median rounded to 250. Season 2: +500 steps or +1 day. |
| W5 | Should | **Peach target under W1:** A averages ~125 min/week. | Sim | Keep A at **135** (met in 1 of 4 weeks). B: 85, then her calibration value × 1.1. |
| W6 | Should | **Calibration weeks aren't set**, and Phase 1 starts Nov 1. | `CALIBRATION_WEEKS = []` | Set `['2026-11-02', '2026-11-09']` and shadow-score them for W4/W5. |
| W7 | Nice | **The rest bonus is nearly free without the Watch.** A 3rd confirmed visit in a week still counts as a rest day. | Sim: rest days 7 | Keep 5 points. Mark **any** visit ≥ 30 min as busy. |
| W8 | Nice | **4 days under 200 steps** count as data and rest days, probably because the phone was left at home. | 66/100/140/168 | Show 「iPhone持ってた？」 when steps < 500. |
| W9 | Nice | **No copy says rest is right when ill.** | — | Juniper line on low weeks: 「熱がある日は休むのが正解」. No cycle tracking. |
| W10 | — | **Pear is still right:** 3 habits, 15/21 ticks, off over 正月. No Watch needed, and illness doesn't reduce them. B's `eat_lunch` stays first. No weight or calorie data. | `ja.json:36-43` | No change. After S1, check that Pear is ≤ 30% of A's median score. |

**Safety:** every category caps at target, so training more never pays more. W3 covers the long tail without bringing Cozy Days back.

**Sign-off:** *Approve with changes.* W1 (one line plus a test) and W6 before Nov 2. W2–W5 with calibration.
