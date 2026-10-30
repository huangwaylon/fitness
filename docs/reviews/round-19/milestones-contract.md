# Milestones: the view contract (v2, from Mon 2026-11-02)

For the UI. The rule is ADR 0021 amendment "v2 milestone curve" and design.md §E; the data is `RULES[1].curve` in
`app/src/lib/config/rules.ts`; the earning is `earnWeek` in `app/src/lib/scoring/bells.ts`. Components never compute
ベル: read the fields below.

## The steps

🍑🍐🍒🍎 pay at 25 / 50 / 75 / 100% of the day's goal (below 25%: 0; above 100%: the max). 🥥 is one event (500).

| | 1 (25%) | 2 (50%) | 3 (75%) | 4 (100%, the goal) |
|---|---|---|---|---|
| 🍑 peach, 60 min | 15 → 25 | 30 → 70 | 45 → 130 | 60 → 240 |
| 🍐 pear, own goal (600 kcal shown) | 150 → 19 | 300 → 53 | 450 → 98 | 600 → 180 |
| 🍒 cherry, 120 min | 30 → 13 | 60 → 35 | 90 → 65 | 120 → 120 |
| 🍎 apple, 8,000 steps | 2,000 → 20 | 4,000 → 60 | 6,000 → 110 | 8,000 → 200 |

## Fields: `WeekView.people[p].rings[fruit]` (`RingProgress`, `app/src/lib/types.ts`)

Added, all optional:

| Field | Type | Meaning |
|---|---|---|
| `milestone` | `number` 0–4 | Steps reached today (4 pips; 4 = the goal met, also 🍎 on a tsuyu day). |
| `nextAt` | `number \| null` | The next step's amount in the same units as `today` / `goal` (minutes, kcal rounded up, steps). null at 4. |
| `nextBells` | `number \| null` | This fruit's ベル today once `nextAt` is reached, a total like `todayBells`. null at 4. |
| `nextGain` | `number \| null` | `nextBells − todayBells`: what reaching it adds. null at 4. |

- **Present** only for `peach`, `pear`, `cherry`, `apple` in a week with a curve (from 2026-11-02). **Absent** (the key
  isn't there) for `coconut` and in v1 weeks (until Sun 11-01), so test with `r.milestone !== undefined` and draw the
  old ring there.
- 「あと 8分で +45」: remaining = `nextAt − today` (🍐 `today` may be fractional kcal: show `Math.ceil`), gain =
  `nextGain`. Example, 22 exercise min: `{ today: 22, goal: 60, todayBells: 25, milestone: 1, nextAt: 30, nextBells:
  70, nextGain: 45 }`.
- 🍐 steps follow the Move goal in force today (`goal`): with 900 kcal, `nextAt` is 225 / 450 / 675 / 900.
- `met`, `weekDays` and `badge` are unchanged: a badge still counts days at the goal (100%).

## The whole table

`milestoneBells(weekKey, fruit)` in `scoring/bells.ts` returns a fruit's ベル per step (`[25, 70, 130, 240]` …), or
null for a week without a curve. The step amounts are `RULES[i].curve.at[k] × goal` (`rulesFor(weekKey)`). あそびかた
(`phone/HelpApp.svelte`) still describes linear pay (`help.pay.perMin` 「1分 4 ベル」, `help.pay.atGoal` 「目標で 180」, 🍎 200): from 11-02 it should show these steps.
