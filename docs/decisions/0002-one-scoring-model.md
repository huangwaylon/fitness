# 0002 — One weekly scoring model: 100 fruit per person, five fruits
**Status:** Accepted (round 1). Resolves conflicts C1 and C4.

**Context.** Fitness capped at 100/wk, nutrition at 100/wk, and the motivation memo targeted 105 Miles/wk. The fruit metaphor had no slot for strength.
All five reviewers converged on one 100-point weekly card per person.

**Decision.** Each person earns up to **100 fruit/week**. Each category pays linearly by % of that person's own weekly target and is capped at its weight.

| Fruit | Category | Weight | Weekly target (examples) | Source |
|---|---|---|---|---|
| 🍑 Peach | Active minutes | 30 | Personal target, e.g. B: 85→160 min, A: 135→185 min | Watch (auto) |
| 🥥 Coconut | Strength days | 20 | 1–3 days with a strength/HIIT/yoga workout ≥ 20 min | Watch workout type (auto) |
| 🍎 Apple | Step days | 10 | Step goal hit on 5 of 7 days | Watch (auto) |
| 🫐 Moon-plum | Sleep & rest | 15 | Sleep target hit on 5 of 7 nights (12) + ≥1 rest day (3) | Watch (auto) |
| 🍐 Pear | Healthy-eating habits | 25 | 15 of 21 habit-ticks (3 habits × 7 days) | Evening check-in (1 tap) |

- **85 fruit = a full week.** Fruit from 85 to 100 is "extra fruit" that can make up shortfalls from earlier weeks only (it never adds beyond the plan), so overtraining earns nothing.
- **Not paid:** Move ring and active calories (they depend on body size), weight, HRV, resting HR, VO2 max, sleep stages. These are shown as personal trends only.
- **Daily caps:** at most 90 active minutes and 1 strength day count per day.
- **Couple bonus:** the Team share (see 0003) pays at the *lower* partner's %. Workouts done together (overlapping ≥ 70%) earn cosmetic rewards, not dollars.

**Consequences.** One generic ratio formula serves every category. Five fruits map 1:1 onto the island trees.
The mockup needs a coconut and loses "Move" as a calorie-based label.

## Round 2 amendments
- **Strength day:** Traditional/Functional Strength, Core or Pilates workouts ≥ 15 min count automatically. HIIT, yoga and similar count after a one-time "did this include strength work?" tap per workout.
- **Daily active-minute cap:** `min(90, max(60, ½ × weekly target))`. This supersedes the flat 90.
- **Rest day:** no workout ≥ 20 min with average HR ≥ 77% of age-predicted max.
- **Together:** workouts overlapping ≥ 70% in time.
- **Prorating:** Cozy Days scale day-count targets by exact fractions, with no rounding.
- **Pear:** always exactly 3 active habits. Seasons *swap* one habit rather than adding one. Holiday grace Dec 20–Jan 1 lowers the target to 12 of 21.
- **Extra fruit** recovers only that person's own earlier shortfall (see 0003 §4).
