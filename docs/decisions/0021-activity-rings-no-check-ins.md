# 0021 — Activity Rings, steps and the gym; no manual check-ins
**Status:** Accepted (user decision 2026-10-30). Amends [0019](0019-bells-daily-earning-two-pots.md) (what earns ベル)
and supersedes its 🍐 eating habits, [0011](0011-mvp-rule-defaults.md) and [0017](0017-round-4-rule-changes-and-rule-versions.md)
§1 (step-derived minutes). Kept the two pots (since replaced by one wallet, [0022](0022-one-wallet-small-luxuries.md)), the menus, the Sunday harvest, the ふたりボーナス, きろく, rule versioning
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
   | 🥥 coconut | **Gym** (strength) | an arrival at a gym, or a Watch strength workout | `gym` arrivals / workouts |

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

## Amendment 2026-10-30: no daily questions, and the values
**No daily questions** (user decision): the app asks nothing. 「…は筋トレでしたか？」 for ask-type workouts (HIIT, yoga,
core, mixed cardio, cross training) is removed with `WeekView.pending`. Only the auto strength types
(`STRENGTH.autoTypes`: Traditional / Functional Strength Training, Pilates, ≥ 15 min) or a きろく mark
(`workout_edit {strength}`) make a workout a 🥥 day; any other type counts only when marked in きろく. Old `confirm` rows
(and `checkin` rows) stay in the sheet and are ignored; the script still accepts both, so an old client's queue never jams. *(No longer true: `EVENT_TYPES` in `app/src/lib/contract/api.ts` now refuses `checkin` and `confirm` with `bad_request`.)*

**Values** (`RULES[0]`, edited in place: play money, the economy's first week; `rules.test.ts`):

| | Daily goal | ベル a day | Badge |
|---|---|---|---|
| 🍑 Exercise | 60 min | 3 per minute (max 180) | ≥ 5 days |
| 🍐 Move | per person (`pref` moveGoal, 100–2,000; default 600 / 400) | floor(180 × min(kcal, goal) / goal) | ≥ 5 days |
| 🍒 Stand | 180 min | 1 per minute (max 180) | ≥ 5 days |
| 🍎 Steps | 8,000 | 200 | ≥ 4 days |
| 🥥 Gym | a gym day | 400 | ≥ 3 days |

+400 per badge, ふたりボーナス +200 per badge both met. On target: (5 × 180 × 3 + 4 × 200 + 3 × 400) = 4,700 daily +
2,000 badges each, + 1,000 duo = **14,400 ベル a week** for both (was 14,250). Max 1,140 a day per person.

## Amendment 2026-10-30: the gym arrival is `{key, action:"gym"}`
**User decision:** the Arrive automation sends the minimum, `{"key": "<KEY_A or KEY_B>", "action": "gym"}`, plus two
optional fields: `place` (free text ≤ 40, only a label shown in きろく, default ジム) and `at` (the true arrival time, an
ISO 8601 instant with offset; ignored when more than 48 h from the server time, as before). The key is the person: any
arrival is that person's 🥥 day on its Tokyo date, several in a day are one day, and a repeat within 2 minutes is
dropped whatever its label. There is no place list (`config/places.ts` is deleted), no `event` field, and no place
validation; the `presence` action is removed outright (`bad_request`, no compatibility path). The sheet tab keeps its
name `presence` (no sheet change) with simpler columns `[at, person, label, arrived_at]`; it was empty, and a tab with
the old header is relabelled by its first row. One Code.js redeploy; shortcut-health-sync.md §5 has the steps.

## Amendment 2026-10-30: v2 from 2026-11-02, push exercise + strength
**User decision** after the round-19 goals review (`docs/reviews/round-19/goals-data-review.md`): the user wants more
exercise and intensity, so the Exercise goal stays high (the review's 45 min was declined) and Exercise becomes the
biggest daily earner; strength pays more; Stand, the least useful for recomposition, asks less and pays less. Applied as
a **new rule version, `RULES[1]`, from Mon 2026-11-02**: the week of 10-26 has already earned under `RULES[0]`, which
stays unchanged (`rules.test.ts` pins both; `rulesFor(weekKey)` picks the version, so Sunday 11-01 is v1 and Monday
11-02 v2).

| | Daily goal | ベル a day | Badge |
|---|---|---|---|
| 🍑 Exercise | 60 min (unchanged) | **4** per minute (max **240**) | ≥ 5 days |
| 🍐 Move | per person, unchanged (the user enters their Fitness-app goal in きろく → 目標; defaults 600 / 400) | floor(180 × min(kcal, goal) / goal), max 180 | ≥ 5 days |
| 🍒 Stand | **120** min | 1 per minute (max **120**) | ≥ 5 days |
| 🍎 Steps | 8,000 | 200 | ≥ 4 days |
| 🥥 Gym | a gym day | **500** | ≥ 3 days |

Badges **+340** each (was +400), thresholds unchanged; ふたりボーナス +200 per badge both met (unchanged). On target per
person: 5 × 240 + 5 × 180 + 5 × 120 + 4 × 200 + 3 × 500 = 5,000 daily + 5 × 340 = 1,700 badges = 6,700; both 13,400 +
5 × 200 duo = **14,400 ベル a week**, as before, so the prices (ADR 0022) are untouched. The badge value solves
10,000 + 10b + 1,000 = 14,400 (b = 340); the alternative +300 badges with duo +200 would have given 14,000. Max 1,240 a
day per person. Client-side only: no sheet, contract or backend behaviour change. Code.js carried the unused `RULES`
literal (esbuild kept it for `ECONOMY_START = RULES[0].from`); `ECONOMY_START` is now a literal, so the bundle drops
`RULES` and a rule version never changes Code.js again. That one regeneration removes dead code only (new build hash;
a redeploy is optional and changes nothing the server does).

