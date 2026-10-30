# Round 18: the rings contract (ADR 0021) for the UI

Model and engine owner: the senior engineer. Readers: the UI engineer (`components/**`, `routes/**`, `i18n/**`,
`styles/**`). Source of truth: [ADR 0021](../../decisions/0021-activity-rings-no-check-ins.md).

**The one rule of the transition:** 🍐 changes meaning (food → Move). Every new field has a **new name**
(`rings`, `ringBadges`, `RingFruit`, `RING_FRUITS`, `moveGoal`). Old names (`fruits`, `parts`, `badges`, `FruitKey`,
`FRUITS`, `habits`, `ticks`, `minutes*`) are `@deprecated` and keep compiling until the UI has stopped reading them;
then they are deleted (phase 3). **Never read 🍐 from an old field**: since phase 2 the old fields are filled from the
ring numbers only so the old code still type-checks (`parts.pear`, `fruits.pear`, `badges.pear` = Move; no 🍒), and
`ticks` is 0.

**No daily questions (lead, 2026-10-30):** `WeekView.pending` is always `[]` and is deleted in phase 3, with
`PendingConfirmation` and `confirmPending`. Remove しずえ's 「…は筋トレでしたか？」 and the はい / いいえ choice list (and the
`pending.*` i18n keys). Ask types (HIIT, yoga, …) count as 🥥 only when marked as strength in きろく (`editWorkout(id,
date, {strength: true})`, unchanged).

## Phases

| Phase | What lands | UI impact |
|---|---|---|
| 1 (done) | Types and fields below on the **WeekView** (`rings`, `moveGoal`, `today.rings`, `harvest.ringBadges`), `RING_FRUITS`, the new `RuleVersion` keys, `MOVE_GOAL`, `PEOPLE[p].moveGoal`, the action `setMoveGoal`, demo Move/Stand rows. The pots still count ADR 0019 (the `rings` ベル are a preview). | Start reading the new fields. |
| 2 (done) | The engine: the pots, harvest, ledger and きろく count ADR 0021. The きろく/ledger fields below (marked **P2**). Check-ins and `confirm` earn nothing; `pending` is `[]`; the demo has no check-ins or questions. Already deleted (nothing in the UI read them): `HABITS`, `habitsFor`, `HOLIDAY`, `STEP_MINUTES`, `STRENGTH.askTypes`, `LIMITS.checkinBackDays`, `PersonWeekView.habits`, `DayPerson.habits`, `Workout.includesStrength`, `CheckinTick`, `PersonTargets`, `DayMetrics`, the `checkin` / `fixCheckin` actions, the check-in state. | Numbers change; old fields are aliases of the ring numbers. |
| 3 | Delete the remaining deprecated fields (list at the end). `FruitKey` becomes an alias of `RingFruit`. | Must not read any of them by then. |

## Types (`#lib/types.ts`)

```ts
/** 🍑 Exercise min, 🍐 Move kcal, 🍒 Stand min, 🍎 steps, 🥥 gym. Display order = RING_FRUITS. */
export type RingFruit = 'peach' | 'pear' | 'cherry' | 'apple' | 'coconut';
export type RingBells = Record<RingFruit, number>;

/** Units: 🍑 minutes, 🍐 kcal, 🍒 minutes, 🍎 steps, 🥥 1/0. */
export interface RingProgress {
  today: number;      // 🍑 max(Watch, workouts added in きろく); 🥥 1 on a gym day
  goal: number;       // 60 · the person's Move goal in force today · 180 · 8,000 · 1
  met: boolean;       // 🍎 also by the tsuyu rule (≥ 30 exercise min, Jun 1 – Jul 20)
  todayBells: number;
  weekDays: number;   // days this week meeting the goal
  weekGoalDays: number; // 5 · 5 · 5 · 4 · 3
  badge: boolean;
  weekBells: number;  // this fruit's daily ベル, days up to today (badge bonus not included)
}

interface PersonWeekView {
  // NEW
  rings: Record<RingFruit, RingProgress>;
  moveGoal: number;                                       // kcal in force today
  today: { bells: number; rings: RingBells; /** @deprecated */ parts: FruitBells };
  // DEPRECATED: fruits, habits, today.parts
}

interface HarvestView {
  ringBadges: Record<PersonId, Record<RingFruit, boolean>>; // NEW
  // DEPRECATED: badges
  // unchanged: weekKey, bonus {A, B, duo}, totalBells, confirmedBy
}
```

`today.bells`, `weekBells`, `pots`, `harvest.bonus` / `totalBells` keep their names; from phase 2 they are ADR 0021
numbers (in phase 1 they are still ADR 0019's, so `today.rings` doesn't sum to `today.bells` until phase 2).

### P2: きろく and the ledger (`#lib/model/history.ts`, `#lib/model/bells.ts`)

```ts
interface DayBells { date; bells; rings: RingBells; /** @deprecated */ parts }   // ledger days: people[p].rings
interface LedgerBonus { …; ringBadges: Record<PersonId, Record<RingFruit, boolean>> }  // badges deprecated
interface HistoryPerson { bells; stamps; ringBadges: Record<RingFruit, boolean> }       // badges deprecated

interface WeekDetailPerson { dailyBells; bonus; ringBadges: Record<RingFruit, boolean>; days: DayRow[] } // badges deprecated
interface DayRow {
  date; future; bells; edited; editedFields;            // unchanged
  rings: RingBells;
  met: Record<RingFruit, boolean>;
  steps: number | null;
  exerciseMin: number;           // counted: max(Watch, workouts added); no step-derived minutes any more
  minutesSource: 'watch' | 'edit' | 'manual' | null;   // of exerciseMin ('steps' is gone)
  moveKcal: number | null;
  moveGoal: number;              // the goal in force that day
  standMin: number | null;
  gym: boolean;
  // DEPRECATED: minutes (= exerciseMin), strength (= gym), ticks (0), parts
}
type EditedField = 'steps' | 'minutes' | 'move' | 'stand' | 'workout' | 'ticks';  // + 'move', 'stand'

interface DayPerson {
  bells; workouts; visits; steps: { value; edited };     // unchanged
  rings: RingBells;
  met: Record<RingFruit, boolean>;
  exercise: { value: number; watch: number | null; source: 'watch' | 'edit' | 'manual' | null; edited: boolean };
  move: { value: number | null; goal: number; edited: boolean };
  stand: { value: number | null; edited: boolean };
  // DEPRECATED: minutes (= exercise, source never 'steps'), habits, parts
}
EditLog.field: + 'move_kcal' | 'stand_min'   // a metric_set of Move/Stand (accepted, like steps/minutes)
```

Stamps (`'strength' | 'active' | 'none' | 'future'`) keep their names: `strength` = a gym day, `active` = ≥ 20
counted exercise minutes or a step day.

## Rules (`#lib/config/rules.ts`)

```ts
RING_FRUITS = ['peach', 'pear', 'cherry', 'apple', 'coconut']       // display order
PEOPLE[p].moveGoal  // default Move goal: A 600, B 400 (kcal)
MOVE_GOAL = { min: 100, max: 2000 }                                 // pref bounds, integer kcal

RuleVersion (read RULES[RULES.length - 1] for the help text):
  goals:  { exerciseMin: 60, standMin: 180, steps: 8000 }           // Move goal: per person
  bells:  { perExerciseMin: 3, moveAtGoal: 180, perStandMin: 1, stepDay: 200, gymDay: 400 }
  badges: { exerciseDays: 5, moveDays: 5, standDays: 5, stepDays: 4, gymDays: 3, bells, duoPerBadge }
  // bells 400, duoPerBadge 200 (phase 2)
  // DEPRECATED: goals.activeMin, bells.perMinute/strengthDay/perTick, badges.activeDays/strengthDays/ticks
```

Daily max per person (phase 2): 3 × 60 + 180 + 180 + 200 + 400 = **1,140 ベル** (`dayMax()` in
`components/island/progress.ts` should use these keys). 🍐 pays `floor(180 × min(kcal, goal) / goal)`.

## Actions (`#lib/store/actions.ts`)

```ts
setMoveGoal(kcal: number): SendResult
// sends pref {key:'moveGoal', value: round(kcal)}; {ok:false} outside 100–2,000. Applies from today on, never to
// earlier days (the model reads the last moveGoal made on or before each day). Shown at once (optimistic).
```

`checkin` and `fixCheckin` are gone (phase 2); `confirmPending` goes in phase 3. `setMetric` stays `'steps' | 'exercise_min'` (Move/Stand edits are
accepted by the model and the server if the UI ever wants them: `metric_set {metric:'move_kcal' | 'stand_min'}`).

## Host lines

The model emits only `host.harvest_ready`, `host.harvest_waiting`, `host.default` (unchanged). No new keys.

## What the UI must stop reading before phase 3 (grep `components/` and `routes/`)

`FRUITS`, `FruitKey`, `FruitProgress`, `FruitBells` (except via `RingBells`), `.fruits`, `.parts`, `.badges` (on
harvest / ledger / history; use `ringBadges`), `.ticks`, `.minutes` and `.strength` (DayRow /
DayPerson: use `exerciseMin` / `exercise` / `gym`), `EditLog.field === 'checkin'`, `EditedField 'ticks'`, `DAILY.maxTicks`,
`r.goals.activeMin`, `r.bells.perMinute`, `r.bells.strengthDay`, `r.bells.perTick`, `r.badges.activeDays`,
`r.badges.strengthDays`, `r.badges.ticks`, `.pending`, `confirmPending`, `PendingConfirmation`, and the i18n keys
`habit.*`, `pending.*`, `kiroku.src.steps`, `kiroku.field.checkin`.

## Requests from UI

UI engineer, 2026-10-30. Newest last; the engine owner ticks them off.

1. **Delete `confirmPending` and `WeekView.pending` now (phase 3 early), please.** The island no longer reads `pending`
   (no daily questions), so once the UI commit lands `confirmPending` is an unused export and `npm run knip` fails the
   Pages build. I'm holding that UI commit until `confirmPending` is gone from `store/actions.ts`.
2. **Old fields:** I'll list each one here as *free to delete* once the UI commit that stops reading it is on main
   (the island, partner, きろく, ledger and harvest commits are in progress). Free now: nothing new (`habits` was already
   gone in phase 2).
3. **Week badge progress per person** in `weekDetail()` and `historyWeeks()`: `ringWeek: Record<RingFruit, { days:
   number; goal: number }>` (days met so far / the badge threshold of that week's rule version). Until then the UI
   counts `days[].met` and reads the latest `RULES` thresholds.
