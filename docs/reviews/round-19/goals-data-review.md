# Round 19: goals, targets and economy against real data
**Date:** 2026-10-30. **Panel:** strength and conditioning coach, game-economy designer, data analyst, and (§6) a
registered dietitian. **Scope:** ADR 0019 (amendments), 0020, 0021, 0022, `config/rules.ts`, `scoring/bells.ts`,
design.md §E, against the live sheet snapshot (A's view, 2026-10-30 19:50 JST). **Report only:** no code or rule changed.

**Bottom line.** Steps (8,000) and gym (3 days) are well set. Exercise 60, Stand 180 and Move 600 were never reached
together, even on ウェイ's best Watch days, so those three badges and their ふたりボーナス shares are close to
unreachable. The low earnings so far mostly come from **not wearing the Watch** (28 of 33 days have no Watch data),
not from low activity. Fix the three goals and keep the prices. Move 300 ベル a week per person from Stand to the gym,
which leaves the on-target week at exactly 14,400.

---

## 1. The data and its quality

- **Range:** 33 dates, 2026-09-28 to 10-30 (today is partial). 131 metric rows, all ウェイ's. **うめ: no rows**, so every
  "both" number below assumes she earns like him.
- **Watch metrics (Exercise, Move, Stand) exist on only 5 dates:**
  - 9/29: Exercise only. The Shortcut then had no Move or Stand fields.
  - 9/30: worn for part of the day (Stand 58).
  - 10/8: barely worn (Stand 9).
  - 10/29: a full day.
  - 10/30: partial (to 19:50).

  The other 28 days are `0` for all three. 10/4 shows 20,821 steps and 0 exercise minutes, so these are days without
  the Watch, not inactive days (profiles.md: "often iPhone only"). Because of Fill Missing, a `0` can't be told apart
  from "not worn".
- **Steps (from the iPhone):** 5 days are under 1,000: 9/28 855, 10/9 168, 10/14 140, 10/15 100, 10/26 66. Either the
  phone wasn't carried or the day wasn't captured. These are excluded from the step statistics, as is today (partial).
  That leaves **27 valid step days**.
- **Mac-migration batch:** 2026-10-29 12:51–12:55Z, 62 rows for 9/28–10/28. A full re-sync followed on 10-30 09:56Z
  (64 rows, 9/30–10/30).
  - Every overlapping value agrees, so there are no conflicts or double counts.
  - Only today's values grew between syncs, which is normal.
- **Gym:** one arrival, 10/30 at Anytime Fitness (the automation's first day). The `workouts` tab is empty, so no Watch
  strength workout has ever arrived.
- **Weight:** one weigh-in, 66 kg on 10/30 (§5).
- **The economy's first week (from Mon 10/26)** has 66, 7,000 and 4,963 steps before the Watch went back on, so it
  looks worse than his usual weeks.

## 2. ウェイ per metric

| Metric | n (excluded) | p25 / median / p75 | Days at goal | Weekly badge |
|---|---|---|---|---|
| 🍎 Steps ≥ 8,000 | 27 valid (6 excluded: 5 under 1,000, plus today) | 6,773 / **8,702** / 10,592 (weekday median 8,564, weekend 8,739) | **15/27 = 56%** (≥ 7,000: 74%) | ≥ 4 days in **1 of 4** full weeks (6, 2, 3, 3 days; two near misses) |
| 🍑 Exercise ≥ 60 min | 4 worn (9/29 23, 9/30 22, 10/29 58, 10/30 67) | n too small: 22 / 40 / 60 | **1/4** (≥ 45: 2/4) | not estimable. An 8.5k–9k-step day gives ~22 min, so 60 needs a dedicated session |
| 🍐 Move ≥ 600 kcal | 3 (249 partial, 527, 531) | — | **0/3**. 527 was a 23,836-step day; 531 was a gym day | ~0% at 600 |
| 🍒 Stand ≥ 180 min | 3 (58 partial, 157, 82 by 19:50) | — | **0/3**. Best 157, on the 23,836-step day | ~0% at 180 |
| 🥥 Gym | 1 arrival | — | 1 day | baseline unknown (automation started 10/30) |

**Simulated ベル** (`earnWeek` from `scoring/bells.ts`, current RULES, Move goal 600; script in `/tmp/r19/sim/`). The
week of 10/26 runs to Friday evening.

| Week (Mon) | As recorded | Watch worn daily at his 10/29–30 level (62 min, 529 kcal, 120 stand), real steps, real gym | Same + 3 gym days | "Moderate" day (45 min, 450 kcal, 150 stand) + 2 gym |
|---|---|---|---|---|
| 9/28 | 1,867 (step badge) | 5,206 | 6,806 | 5,340 |
| 10/5 | 438 | 4,006 | 5,606 | 4,140 |
| 10/12 | 600 | 4,206 | 5,806 | 4,340 |
| 10/19 | 600 | 4,206 | 5,806 | 4,340 |
| 10/26 (partial) | 1,510 | 3,290 | 4,490 | 3,100 |
| **Mean / week** | **1,003 = 15% of 6,700** | 4,183 = 62% | 5,703 = 85% | 4,252 = 63% |

Even with the Watch on every day and 3 gym days, he never earns the 🍐 or 🍒 badge, so a person's ceiling in practice is
about 85% of target. The pair also loses those two ふたりボーナス shares (400 a week).

## 3. Difficulty of each goal (coach)

| Goal | Evidence | His baseline | Verdict |
|---|---|---|---|
| 🍎 8,000 steps, ≥ 4 days | 健康日本21 (第三次) and the MHLW 2023 guide say 8,000. Mortality benefit flattens at 8–10k under 60 (Paluch 2022) | median 8,702, 56% of days | **Keep.** Reachable with effort: two weeks missed the badge by one day |
| 🍑 60 min, ≥ 5 days | Apple's default is 30. WHO says 150–300 min/week; 60 × 5 = 300 is the top of that range. ACSM: > 250 min for weight-loss maintenance | ~22 min on an ordinary day; 58–67 only on a 24k-step day or a gym day | **Too hard to start:** it needs 5 dedicated hours a week on top of the gym. **45 min** (225 min/week, the middle of WHO's range) is reachable on gym days plus 2 long-walk days |
| 🍐 Move 600 kcal, ≥ 5 days | Active energy scales with body mass. At 66 kg, 10k steps ≈ 300–350 kcal. 600 is a very active level; Apple usually suggests ~400–500 for his size | 0 of 3 days, even at 23,836 steps | **Too hard:** it rewards only extreme days. Set it to his Fitness-app goal, or **450** (gym days and 12k+ step days reach it). うめ (55 kg): **300**, or her Fitness-app goal |
| 🍒 Stand 180 min, ≥ 5 days | Health "Stand Time" counts minutes of standing movement. Apple's ring asks 12 hours with 1 standing minute each. An office day at 3 days/week in the office gives ~90–150 Stand minutes | best 157 (23,836 steps) | **Too hard, and the least important for recomposition.** Lower it to **120** |
| 🥥 3 gym days | ACSM 2009 and NSCA: 2–3 full-body sessions a week for novices. Hypertrophy needs ~10 sets per muscle per week (Schoenfeld 2017) | 1 day so far | **Keep 3.** The arrival-counts rule makes it easy to log; the work done there is on him (round 12: a written 3-day programme) |

**Starter phase:** the user declined phases in round 12. Recalibrating the three goals does the job of a starter phase
permanently. Review them after the calibration weeks (Nov 2, Nov 9) with 2+ weeks of Watch data from both people.

## 4. The economy (economy designer)

Per-person shares of the on-target 6,700, with the daily ベル plus that fruit's badge:

| | 🍑 | 🍐 | 🍒 | 🍎 | 🥥 |
|---|---|---|---|---|---|
| Current | 1,300 (19%) | 1,300 (19%) | 1,300 (19%) | 1,200 (18%) | 1,600 (24%) |
| Proposed | 1,300 (19%) | 1,300 (19%) | **1,000 (15%)** | 1,200 (18%) | **1,900 (28%)** |

- **Price ratios:** おやつ : カフェ : 外ごはん : ほしいもの : 旅 = 1 : 2.1 : 5 : 6.7 : 10. That's a sensible ladder.
  外ごはん and ほしいもの are close together (6,000 vs 8,000), but that's harmless.
- **Badges vs daily ベル:** the daily ベル are 65–70% of the week, so a short week still pays. Keep +400 per badge.
- **ふたりボーナス:** +200 per shared badge is fine. Today it is effectively capped at 600, because 🍐 and 🍒 can't be
  met. With the goals fixed, the full 1,000 is reachable.
- **Stacking:** one brisk walk pays 🍑, 🍐, 🍎 and 🍒 at the same time. That's acceptable, because it's NEAT, which
  matters for fat loss. But it's why Stand shouldn't be paid as much as strength.

## 5. Weight (data analyst and coach)

- **The data:** one weigh-in, 66.0 kg on 10/30, the same as profiles.md (175 cm, BMI 21.6). The trend needs 14 days
  before it shows a pace (`WEIGHT.minRateDays`).
- **The goal is small per week:** −4 kg by 2027-10-08 (49 weeks) needs 0.08 kg a week on average. At 0.25 kg a week
  it takes ~16 weeks, then maintenance and recomposition.
- **Advice:**
  - Weigh every morning, after the toilet and before eating. The Health scale sync already works.
  - Ignore any single day: water swings it by 1–2 kg.
  - Judge after 4 weeks of trend.
  - Aim for 0.25 kg a week (~0.4% of body weight). For ウェイ, judge progress mostly by waist (−3 to −5 cm) and lifts
    (round 12), since he will gain muscle.
  - Weight stays unpaid (ADR 0020). Keep it that way.

## 6. Are the rewards challenging enough? (dietitian, trainers, team)

**How often each item is affordable,** if a week's whole income went on that item. For the pair, assuming うめ earns
like ウェイ:
- (a) **Actual:** as recorded, ~1,000 each, so ~2,000 for the pair. "Watch worn" is the realistic near-term pace:
  ~4,200 each plus 200 duo ≈ 8,600.
- (b) **On target:** 14,400.
- (c) **Perfect:** 7 × 1,140 + 2,000 = 9,980 each, plus 1,000 duo = 20,960.

| Item | (a) 2,000/wk | (a′) 8,600/wk | (b) 14,400/wk | (c) 20,960/wk |
|---|---|---|---|---|
| おやつ 1,200 | 1.7 a week | 7.2 a week | 12 a week | 17.5 a week |
| カフェ・デザート 2,500 | every 1.3 weeks | 3.4 a week | 5.8 a week | 8.4 a week |
| 外ごはん 6,000 | every 3 weeks | 1.4 a week | 2.4 a week | 3.5 a week |
| ほしいもの 8,000 | every 4 weeks | 1.1 a week | 1.8 a week | 2.6 a week |
| 旅のごほうび 12,000 | every 6 weeks | every 1.4 weeks | 1.2 a week | 1.7 a week |
| The designed basket (2.5 おやつ + café + 外ごはん every 2 weeks = 8,500) | not affordable | just affordable (~100 left) | affordable, ~5,900 left to save | ~12,500 left |

**Dietitian (registered).**
- **Typical treat calories:**
  - a konbini bag of chips (60 g): ~330 kcal
  - a Häagen-Dazs mini cup: ~240 kcal
  - a konbini sweet (roll cake, pudding): 200–300 kcal
  - a café parfait or cake: 400–700 kcal
  - a dinner out: +300–600 kcal over a home meal (ramen ~800, yakiniku 1,000+)
- **The basket per person:** about 1.25 おやつ (~350), half a café dessert (~250; one shared each week), plus an
  extra meal every 2 weeks (~250). That's **≈ 850–1,100 kcal a week ≈ 120–160 kcal a day**.
- **Against the deficit:** a 0.25–0.5 kg/week loss needs ~275–550 kcal/day (7,700 kcal per kg). The basket uses
  25–55% of that. **This is compatible** if the treats replace the unplanned snacking they had before (うめ's chips),
  rather than adding to it. The 49-week goal needs only ~90 kcal a day on average, so there is room.
- **The risk is at on-target and above:** 5,900 ベル a week are left over. If they go on food (12 おやつ a week = 6
  each ≈ 1,800 kcal), that wipes out most of a week's deficit. Prices don't prevent this; only a norm does.
- **Too few is also a risk:** at today's ~2,000 a week, one snack a week between two people feels like a ban. Rigid
  restriction predicts the "what-the-hell" effect and higher BMI (Polivy & Herman 1985; Westenhoefer 1999). "Earned"
  treats work when they are planned and moderate, not when they are scarce and then binged.
- **Protein** is no longer tracked (ADR 0021) and shouldn't come back as a check-in (the zero-taps rule). Put it in
  あそびかた once:
  - ~1.6 g/kg/day (ウェイ ~105 g, うめ ~90 g)
  - 20–30 g at each of 3 meals
  - うめ: at least 1,500 kcal on training days (RED-S)

**Trainers.**
- The proportions are mostly right. Strength is the one behaviour that builds muscle, and it's the largest single
  share (24%). It should be clearly the largest, so: **🥥 400 → 500 a day**.
- Stand is over-paid for its value to recomposition: **🍒 180 → 120 min**, still 1 ベル a minute, so 120 max.
- Exercise and steps (NEAT) are fairly paid. They also drive the fat-loss side.
- Move duplicates Exercise and steps but helps on gym days. Keep its 180 at the goal.
- Unlimited paid gym days (now 500 each) carry a small overtraining risk. The user declined a cap in round 12; flag it
  again only if there are 5+ paid gym days in a week.

**Team verdict: about right in price, wrong in goals.**
- At today's pace the rewards are **too hard**. That's mostly non-wear, plus three goals he can't reach.
- At on-target they are **slightly generous for food** (5,900 a week spare).
- Changing prices wouldn't fix either problem. The proposals:
  1. **Goals:** 🍑 **45 min** at **4 ベル/min** (max 180, unchanged); 🍐 Move default **A 450 / B 300**, or each
     person's Fitness-app goal entered once; 🍒 **120 min** at 1/min (max 120); 🍎 and the badges unchanged.
  2. **Gym:** 🥥 **500 a day**.
     - On target per person: 900 + 900 + 600 + 800 + 1,500 = 4,700 daily + 2,000 badges = **6,700**, still
       **14,400** for both.
     - Max a day: 1,180.
     - It needs only `RULES` values: `goals.exerciseMin 45`, `goals.standMin 120`, `bells.perExerciseMin 4`,
       `bells.gymDay 500`, plus the `PEOPLE` moveGoal defaults.
     - Simulated on his weeks (Move goal 500 here):

       | Week | As recorded | Watch worn | + 3 gym | Moderate |
       |---|---|---|---|---|
       | mean | 1,039 | 5,148 | **6,948** | 5,529 |

       All five badges become reachable.
  3. **Prices: keep them.** No hard weekly treat cap: it would add a rule and restriction psychology. Add one line of
     guidance instead (あそびかた / the wallet): 「たべもののごほうびは ふたりで週3つくらい。あまったベルは ほしいもの・旅へ」.
     That's about 2 おやつ + 1 カフェ ≈ 4,900 ベル a week. Food treats stay ≤ ~1,100 kcal per person per week, and the
     surplus goes to non-food items.
- **How it would feel week to week:**
  - A normal week with the Watch on and 2 gym days: ~5,500 each, ~11,500 for the pair. That covers the basket plus
    ~3,000 saved, so a ほしいもの or a trip treat every ~3–4 weeks.
  - A perfect week feels like a windfall, not a binge licence.
  - A Watch-less week pays only steps, ~600–1,900. That is the honest nudge to wear it.

## 7. Recommendations (summary)

| # | Change | Reason |
|---|---|---|
| 1 | 🍑 Exercise goal 60 → **45 min**, 3 → **4 ベル/min** (max 180 unchanged) | 1 of 4 Watch days reached 60. 225 min/week is mid-WHO and reachable with 3 gym days and 2 walks |
| 2 | 🍐 Move defaults A 600 → **450**, B 400 → **300**. Each person should enter their Fitness-app goal via `pref` moveGoal. As far as we know, Shortcuts can't read the Activity Move goal, so it can't be synced automatically | 0 of 3 days reached 600, even at 23.8k steps |
| 3 | 🍒 Stand 180 → **120 min** (1/min, max 120) | best day 157; least relevant to recomposition |
| 4 | 🥥 gym day 400 → **500** | strength becomes the top share (28%) and keeps the on-target week at 14,400 |
| 5 | Keep 🍎 8,000 / 4 days, 🥥 3 days, +400 badges, +200 duo, and all five prices | well calibrated; the prices fit the deficit at the designed basket |
| 6 | Add the guideline of ~3 food treats a week for the pair (text only), plus the protein line in あそびかた | stops the on-target surplus from going on food |
| 7 | **Wear the Watch daily** (the biggest lever: 15% → ~60–85% of target). うめ should start syncing | 28 of 33 days had no Watch |
| 8 | Data: optionally show "Watch not worn" in きろく when Exercise, Move and Stand are all 0 but steps > 1,000 | a `0` from Fill Missing hides non-wear |
| 9 | Re-review after the Nov 2 and Nov 9 weeks, with both people's data | n = 2 full Watch days for one person is thin |

Applying 1–4 is a play-money values change. Per `rules.ts`, now that the economy has earned, it should be appended as a
new `RULES` version from the next Monday, not edited in place.
