# 0021 — Activity Rings, steps and the gym; no manual check-ins
**Status:** Accepted (user decision 2026-10-30). Amends [0019](0019-bells-daily-earning-two-pots.md) (what earns ベル)
and supersedes its 🍐 eating habits, [0011](0011-mvp-rule-defaults.md) and [0017](0017-round-4-rule-changes-and-rule-versions.md)
§1 (step-derived minutes). Keeps the two pots, the menus, the Sunday harvest, the ふたりボーナス, きろく, rule versioning
and the weight trend ([0020](0020-weight-trend-never-rewarded.md), never rewarded).

**Context.** The user wants as little manual work as possible. Both wear an Apple Watch, and its Activity Rings
(Move, Exercise, Stand) arrive in Health automatically. The eating check-ins were the last daily manual task
(round 15 research: no Japanese app writes food to Health except あすけん, which moves the work rather than removing
it). Gym visits are now one Arrive automation (an arrival counts, no duration).

## Decision
1. **Five automatic metrics, one NH fruit each** (NH's five native fruits plus the coconut):

   | Fruit | Metric | Daily goal | Source |
   |---|---|---|---|
   | 🍑 peach | **Exercise ring**: Watch exercise minutes (+ workouts added in きろく) | **60 min** (same for both) | Shortcut `exercise_minutes` |
   | 🍐 pear | **Move ring**: active energy, kcal | **per person, editable in the app** (default ウェイ 600, うめ 400) | Shortcut `calories` (active energy) |
   | 🍒 cherry (new) | **Stand**: stand minutes (Health "Stand Time") | **180 min** (same for both) | Shortcut `stand_minutes` (new field) |
   | 🍎 apple | **Steps** | 8,000 (same for both) | Shortcut `steps` |
   | 🥥 coconut | **Gym** (strength) | an arrival at a gym, or a Watch strength workout | presence `arrive` / workouts |

2. **No manual check-ins.** The three eating habits, the check-in sheet and 「ぜんぶできた！」 are removed; old
   `checkin` rows are ignored. Steps no longer turn into minutes (the Exercise ring already counts brisk walking).
3. **ベル per day** (per person; amounts tuned so an on-target week stays ≈ the current ~14,000 ベル for both, so the
   trip prices still fit; exact values in `rules.ts`):
   - 🍑 per exercise minute up to 60; 🍐 proportional to the Move goal, capped at the goal; 🍒 per stand minute up to
     180; 🍎 a flat amount at 8,000 steps; 🥥 a flat amount on a gym day (max one per day).
4. **Weekly badges** (+ベル each at the Sunday harvest): 🍑 / 🍐 / 🍒 goal met on ≥ 5 days, 🍎 ≥ 4 step days,
   🥥 ≥ 3 gym days. ふたりボーナス: + per badge both people met.
5. **Move goal editing:** a per-person `pref` (`moveGoal`, kcal, sane bounds), set in the app; the economy reads the
   goal in force on each day (a change applies from the day it's made, never re-pricing earlier days).
6. **Shortcut:** add **Stand Time** (minutes; Shortcuts doesn't expose the ring's Stand *Hours*), grouped by day with
   Fill Missing like the others, as a `stand_minutes` Text list (one line per day). Amended 2026-10-30 after the
   `uploads` log showed 58 on a day (minutes, not hours); the user set the goal to 180 min.
   `calories` is confirmed to be active energy (≈ 250 kcal days in the log, not ≈ 2,000 total).

## Consequences
- The daily loop has zero required taps: wear the Watch, carry the phone; the island shows the day's ベル.
- Stand 180 min needs the Watch worn most of the day; Exercise 60 min is double Apple's default (the badge needs 5 of 7 days and
  every minute pays on its own).
- The backend parser and contract gain `stand_minutes` (and a stored metric for Move kcal): one Code.js redeploy.
