# 0023 — Anyone edits anyone's data; gym overrides
**Status:** Accepted (user decision 2026-10-31). Amends [history-and-editing.md](../design/history-and-editing.md) §4.2
("own data only") and [0021](0021-activity-rings-no-check-ins.md) (an arrival or a strength workout makes a 🥥 day).
Keeps the week lock ([0019](0019-bells-daily-earning-two-pots.md): edits count only until the Wednesday 04:00 after
the week), ADR 0015 (append-only, compute-on-read) and ADR 0016 (everything visible).

**Context.** Two people share one game. When one of them forgets to fix a number (or the Watch, the Shortcut or the
gym automation fails), the other should be able to fix it from their own phone. The gym arrival automation sometimes
misses a visit and sometimes fires without one, and the only fix was a workout mark in きろく.

## Decision
1. **Either person edits either person's data.** The edit events carry an explicit target, `data.person: 'A'|'B'`
   (absent = the sender, so old rows read as before): `metric_set` (activity metrics and weight), `workout_edit`,
   `workout_add`, `gym_set`, and `pref` for the two goals only (`moveGoal`, `goalWeight`). The model applies the edit to
   the target and records the sender as `by`. Everything else stays the sender's own (`locale`, `villagerName`,
   `villager`; `spend_void` stays the buyer's).
2. **Who fixed it is always shown.** The change log in きろく shows whose data (the avatar) and who fixed it
   (「うめが なおしました」).
3. **`gym_set {person, date, on}`.** `on: true` makes the date a 🥥 day without an arrival or a strength workout; `on:
   false` cancels it even with them. The latest by server order wins per person and date; there is no "automatic"
   value (set it back by setting the other way). It earns, so it follows the week lock like the other activity edits.
   The 🥥 ベル, the 🥥 badge and the ふたりボーナス are recomputed from it.
4. **Where.** きろく day detail: ✎ on both people's cards (steps, exercise minutes, 🥥, workouts, ＋), the 目標 card
   switches between the two people, either weight screen logs and fixes weights. The island's tree popup: two check
   chips, きのう / きょう, in that tree's 🥥 row, one tap each, held 5 s with とりけす like every edit.
5. **The server checks the shape tightly:** `person` only `A` or `B` and only on the types above, `gym_set` a real
   calendar date and a boolean; anything else is `bad_request`. One Code.js redeploy.

## Consequences
- Either phone can fix a forgotten or wrong day for both people; nothing is hidden, and the log says who did it.
- An arrival after `gym_set {on:false}` on the same date does not turn it back on; set it on again.
- Yesterday is always in an open week (a Sunday's week locks on the Wednesday after), so the tree popup's きのう chip
  never meets a lock in practice; it still checks it (🔒) like every edit.
- **Open question for the user:** the week lock is kept ("any data" could mean locked weeks too). Dropping it would
  let an edit change a week whose ベル were already spent, so buys made from them could stop being covered.
