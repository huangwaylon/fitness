# History and editing: the きろく app

User decisions: edits only in **open weeks** (locked weeks are view-only; 2026-10-29), and **either person edits either
person's data** (2026-10-31, [ADR 0023](../decisions/0023-anyone-edits-anyones-data-gym-overrides.md); the log says who
fixed it), including a 🥥 gym day turned on or off by hand (`gym_set`). Bound by ADR 0015 (append-only,
compute-on-read) and ADR 0016 (everything visible, no alerts). Code:
`app/src/lib/model/history.ts` (the views and the change log), `components/kiroku/*` (the UI), `store/actions.ts`
(the edits).

## 1. What is recorded and shown

| Scope | Data | Source |
|---|---|---|
| Person × day | steps; exercise minutes = max(Watch, hand-added workouts); Move kcal and the goal in force; stand minutes; workouts (type, minutes, strength ✓/✗); gym arrivals; the 🥥 gym day (automatic or set by hand) | `metrics`, `workouts`, `presence`, edit events |
| Person × day | ベル per fruit | `weekBells` (`earnWeek`) |
| Person × week | ベル (daily + badge bonus), the five badges and the days met | `historyWeeks`, `weekDetail` |
| Week | ベル (both, incl. the bonus once landed), harvested, locked | `historyWeeks` |
| Money | the wallet, each day's ベル, the weekly bonuses, buys (voided or not) | `bellsLedger` |
| Body | weight trend, weigh-ins, goal ([ADR 0020](../decisions/0020-weight-trend-never-rewarded.md)) | `model/weight.ts` |
| Audit | every accepted edit: whose data, who fixed it, when, before → after | `editLog` |

## 2. Where it lives

The NookPhone app **きろく** (official `phone/miles` tile, first in the grid), with two pills: **からだ** | **ベル**. The
island's ribbon (today's ベル) opens it on ベル. ‹ goes up one level, ✕ closes the phone (design.md §N).

## 3. Screens

- **からだ:** the weight card (one row per person: trend kg, this week's change, a sparkline → that person's weight
  screen), 目標 (a Move goal and a weight goal, each with ✎; two avatar pills switch whose, mine first), then the week list: newest first, one Nook Miles+ card per
  week since the economy started, with 🔒 once locked, ✓ once harvested, and per person the five badge fruits (lit =
  met; this week also the days so far).
- **Week detail:** the week's ベル and 🔒 (or how long it stays editable); per person the five badges with days met and
  the bonus once landed; a day table (one row per day, a line per person, the five metrics, met = bold green; tap → the
  day); the week's change log.
- **Day detail:** two cards, me then the partner: the day's ベル, one row per fruit (value, met, ベル), the workouts
  and gym arrivals (label or ジム). ✎ on **both** cards' steps, exercise minutes, 🥥 (ジムの日にする / しない) and
  workouts, and ＋ ワークアウト, only while the week is open (a locked day's cards say 見るだけ); an edit screen for
  the partner names them (「うめ · 11/2(月)」); へんこう履歴 at the bottom.
- **Edit:** numbers on the Nook Stop ATM keypad (old value grey, new in Fredoka 44) + ▶ けってい / やめる; a workout:
  count as strength / not / leave out; weights and the Move goal in a 16px numeric field. Every edit shows at once and
  waits 5 s with とりけす on the banner before it is sent.
- **Weight screen:** trend, week change, since start, weekly pace, a 12-week chart (dots = weigh-ins, line = trend,
  dashes = goal), a goal month at the current pace; 体重を記録 and a fix per recent day (on either person's). No
  "good/bad" colours.
- **The island's tree popup:** in that person's 🥥 row, two check chips きのう / きょう (≥ 44px; ✓ = a gym day, by an
  arrival, a workout or by hand): one tap sets `gym_set` the other way, with the toggle cue and the とりけす banner; the
  popup stays open. A chip in a locked week shows 🔒 and does nothing.
- **ベル (the passbook):** everything earned, then the ledger by week, newest first: the Sunday bonus, the buys (my own
  → とりけす, asked first) and one line per day (tap → the day). 🔒 once the week locked.

## 4. Editing model

### 4.1 Edit events (in `events`; append-only, deduped by `id`)

| type | data | Effect |
|---|---|---|
| `metric_set` | `{person?, date, metric, value}` | Overrides the day's activity value, **also lower**; or sets the day's weight |
| `workout_edit` | `{person?, id, strength?: boolean\|null, excluded?: boolean}` | Strength override for any type (`null` = automatic) and/or out of scoring |
| `workout_add` | `{person?, id:'m:<id>', date, type, durationMin, strength?}` | A workout added by hand (Watch forgotten), at noon Tokyo; its minutes count toward 🍑 as max(Watch, hand-added), never a sum |
| `gym_set` | `{person?, date, on: boolean}` | The day's 🥥: `true` = a gym day without an arrival or a strength workout (a missed automation), `false` = not one even with them (a false arrival). Latest wins per person and date |
| `pref` (goals) | `{person?, key: 'moveGoal'\|'goalWeight', value}` | Either person's Move goal or weight goal |
| `spend_void` | `{spendId}` | Takes a buy back |

`person` (`A`|`B`) is whose data the edit changes; absent, the sender's (every row before ADR 0023). The client always
sends it.

**Latest edit wins, by server `at`.** A day's 🥥 = the latest `gym_set` (at ≤ T) if any, else an arrival or a strength
workout that day (`gymDayAsOf`; `earnWeek` applies the same overrides, so the badge and the ふたりボーナス follow). A
metric as of T: S = the latest `metric_set` with `at ≤ T`; none → the max of the
ingest rows; else max(S, ingest rows with S.at < at ≤ T). So a later, higher sync still wins (more walking), and a stale
re-send can't revive a wrong value (the script appends only above the sheet's max). A day's weight is the **latest** of
its rows and edits (it goes down too).

### 4.2 Who may edit what

Either person edits either person's data (ADR 0023): the subject is `data.person`, else the sender (`row.person`), and
the sender is recorded as `by`. `person` is allowed only on `metric_set`, `workout_edit`, `workout_add`, `gym_set` and
the goal prefs (`moveGoal`, `goalWeight`); on anything else (or not `A`/`B`) the script refuses the event and the model
ignores it. The other prefs (`locale`, `villagerName`, `villager`) stay the sender's own; `spend_void`: the buyer only.
Everything stays visible, and every change shows in the log with who made it.

### 4.3 Locks

Activity edits (`metric_set` of an activity metric, `workout_*`, `gym_set`), by either person, count only while the
day's week is open: this week, and last week until Wednesday 04:00 JST (so ≤ ~9.5
days back). A week's ベル move with edits until its lock and are fixed at it, so buys made from them stay covered.
Weight edits, the goal prefs and `spend_void` never lock (they don't change past earnings). Yesterday is always in an
open week, so the tree popup's きのう chip never meets a lock in practice (it still checks). *Open question for the
user: "any data" could include locked weeks; the lock stays because those weeks' ベル may already be spent.*

**Held edits.** The server stamps the send time, so the client judges an edit by when it will be sent: きろく's controls
close 65 s before the lock; a hold never runs past lock − 60 s (a hovered banner holds at most 2 min); within 5 s of the
lock an edit is refused at once. A queued edit that would reach the server after its lock (offline) is dropped unsent
with a message, and so is an acked edit stamped after it. A later event on the same subject (a metric, a workout, a
buy) never overtakes a held one, so the server keeps the on-screen order.

### 4.4 Audit trail

The model derives `EditLog {at, person, by, date, field, before, after}` (`person` = whose data, `by` = who fixed it;
`field` includes `gym`, before / after = a gym day or not; `before` = the value as of `at − 1`); refused and no-op
edits are not shown. へんこう履歴 shows whose avatar, the change and 「〇〇が なおしました」. The ✎ marks in the week
table and the day go on the person whose data changed. The sheet stays the raw audit.
