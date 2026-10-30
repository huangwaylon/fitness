# History and editing: the きろく app

User decisions (2026-10-29): edits are **own data only**, and only in **open weeks** (locked weeks are view-only). Bound
by ADR 0015 (append-only, compute-on-read) and ADR 0016 (everything visible, no alerts). Code:
`app/src/lib/model/history.ts` (the views and the change log), `components/kiroku/*` (the UI), `store/actions.ts`
(the edits).

## 1. What is recorded and shown

| Scope | Data | Source |
|---|---|---|
| Person × day | steps; exercise minutes = max(Watch, hand-added workouts); Move kcal and the goal in force; stand minutes; workouts (type, minutes, strength ✓/✗); gym arrivals | `metrics`, `workouts`, `presence`, edit events |
| Person × day | ベル per fruit | `weekBells` (`earnWeek`) |
| Person × week | ベル (daily + badge bonus), the five badges and the days met | `historyWeeks`, `weekDetail` |
| Week | ベル (both, incl. the bonus once landed), harvested, locked | `historyWeeks` |
| Money | the wallet, each day's ベル, the weekly bonuses, buys (voided or not) | `bellsLedger` |
| Body | weight trend, weigh-ins, goal ([ADR 0020](../decisions/0020-weight-trend-never-rewarded.md)) | `model/weight.ts` |
| Audit | every accepted edit: who, when, before → after | `editLog` |

## 2. Where it lives

The NookPhone app **きろく** (official `phone/miles` tile, first in the grid), with two pills: **からだ** | **ベル**. The
island's ribbon (today's ベル) opens it on ベル. ‹ goes up one level, ✕ closes the phone (design.md §N).

## 3. Screens

- **からだ:** the weight card (one row per person: trend kg, this week's change, a sparkline → that person's weight
  screen), 目標 (my Move goal and weight goal, each with ✎), then the week list: newest first, one Nook Miles+ card per
  week since the economy started, with 🔒 once locked, ✓ once harvested, and per person the five badge fruits (lit =
  met; this week also the days so far).
- **Week detail:** the week's ベル and 🔒 (or how long it stays editable); per person the five badges with days met and
  the bonus once landed; a day table (one row per day, a line per person, the five metrics, met = bold green; tap → the
  day); the week's change log.
- **Day detail:** two cards, me then the partner (見るだけ): the day's ベル, one row per fruit (value, met, ベル), the
  workouts and gym arrivals (label or ジム). ✎ on my steps, exercise minutes and workouts, and ＋ ワークアウト, only
  while the week is open; へんこう履歴 at the bottom.
- **Edit:** numbers on the Nook Stop ATM keypad (old value grey, new in Fredoka 44) + ▶ けってい / やめる; a workout:
  count as strength / not / leave out; weights and the Move goal in a 16px numeric field. Every edit shows at once and
  waits 5 s with とりけす on the banner before it is sent.
- **Weight screen:** trend, week change, since start, weekly pace, a 12-week chart (dots = weigh-ins, line = trend,
  dashes = goal), a goal month at the current pace; on mine, 体重を記録 and a fix per recent day. No "good/bad"
  colours.
- **ベル (the passbook):** everything earned, then the ledger by week, newest first: the Sunday bonus, the buys (my own
  → とりけす, asked first) and one line per day (tap → the day). 🔒 once the week locked.

## 4. Editing model

### 4.1 Edit events (in `events`; append-only, deduped by `id`)

| type | data | Effect |
|---|---|---|
| `metric_set` | `{date, metric, value}` | Overrides the day's activity value, **also lower**; or sets the day's weight |
| `workout_edit` | `{id, strength?: boolean\|null, excluded?: boolean}` | Strength override for any type (`null` = automatic) and/or out of scoring |
| `workout_add` | `{id:'m:<id>', date, type, durationMin, strength?}` | A workout added by hand (Watch forgotten), at noon Tokyo; its minutes count toward 🍑 as max(Watch, hand-added), never a sum |
| `spend_void` | `{spendId}` | Takes a buy back |

**Latest edit wins, by server `at`.** A metric as of T: S = the latest `metric_set` with `at ≤ T`; none → the max of the
ingest rows; else max(S, ingest rows with S.at < at ≤ T). So a later, higher sync still wins (more walking), and a stale
re-send can't revive a wrong value (the script appends only above the sheet's max). A day's weight is the **latest** of
its rows and edits (it goes down too).

### 4.2 Who may edit what

The subject is the sender (`row.person`); the data has no person field, so the partner's record is unreachable.
Everything stays visible, and every change shows in the log. `spend_void`: the buyer only.

### 4.3 Locks

Activity edits count only while the day's week is open: this week, and last week until Wednesday 04:00 JST (so ≤ ~9.5
days back). A week's ベル move with edits until its lock and are fixed at it, so buys made from them stay covered.
Weight edits and `spend_void` never lock (they don't change earnings).

**Held edits.** The server stamps the send time, so the client judges an edit by when it will be sent: きろく's controls
close 65 s before the lock; a hold never runs past lock − 60 s (a hovered banner holds at most 2 min); within 5 s of the
lock an edit is refused at once. A queued edit that would reach the server after its lock (offline) is dropped unsent
with a message, and so is an acked edit stamped after it. A later event on the same subject (a metric, a workout, a
buy) never overtakes a held one, so the server keeps the on-screen order.

### 4.4 Audit trail

The model derives `EditLog {at, by, date, field, before, after}` (`before` = the value as of `at − 1`); refused and
no-op edits are not shown. The sheet stays the raw audit.
