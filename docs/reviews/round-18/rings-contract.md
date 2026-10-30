# Round 18: the rings contract (ADR 0021) for the UI

Model and engine owner: the senior engineer. Readers: the UI engineer (`components/**`, `routes/**`, `i18n/**`,
`styles/**`). Source of truth: [ADR 0021](../../decisions/0021-activity-rings-no-check-ins.md).

**The one rule of the transition:** 🍐 changes meaning (food → Move). Every new field has a **new name**
(`rings`, `ringBadges`, `RingFruit`, `RING_FRUITS`, `moveGoal`). Old names (`fruits`, `parts`, `badges`, `FruitKey`,
`FRUITS`, `habits`, `ticks`, `minutes*`) are `@deprecated` and keep compiling until the UI has stopped reading them;
then they are deleted (phase 3). **Never read 🍐 from an old field**: in phase 2 the old `parts.pear` becomes Move
ベル only so the old code still type-checks, and the old `fruits.pear` / `habits` / `ticks` go to zero.

## Phases

| Phase | What lands | UI impact |
|---|---|---|
| 1 (now) | Types and fields below on the **WeekView** (`rings`, `moveGoal`, `today.rings`, `harvest.ringBadges`), `RING_FRUITS`, the new `RuleVersion` keys, `MOVE_GOAL`, `PEOPLE[p].moveGoal`, the action `setMoveGoal`, demo Move/Stand rows. The pots still count ADR 0019 (the `rings` ベル are a preview). | Start reading the new fields. |
| 2 | The engine: the pots, harvest, ledger and きろく count ADR 0021. The きろく/ledger fields below (marked **P2**). Check-ins earn nothing (old `checkin` rows ignored); the demo has no check-ins. | Numbers change; old fields go stale. |
| 3 | Delete the deprecated types/fields, `HABITS`, `HOLIDAY`, `STEP_MINUTES`, `DAILY.maxTicks`, `checkin`/`fixCheckin` actions, check-in state. `FruitKey` becomes an alias of `RingFruit`. | Must not read any of them by then (grep list at the end). |

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
  moveKcal: number | null;
  moveGoal: number;              // the goal in force that day
  standMin: number | null;
  gym: boolean;
  // DEPRECATED: minutes (= exerciseMin), minutesSource, strength (= gym), ticks (0), parts
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
  // phase 1: bells/duoPerBadge are still 500/250; phase 2: 400/200
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

Phase 3 removes `checkin` and `fixCheckin`. `setMetric` stays `'steps' | 'exercise_min'` (Move/Stand edits are
accepted by the model and the server if the UI ever wants them: `metric_set {metric:'move_kcal' | 'stand_min'}`).

## Host lines

The model emits only `host.harvest_ready`, `host.harvest_waiting`, `host.default` (unchanged). No new keys.

## What the UI must stop reading before phase 3 (grep `components/` and `routes/`)

`FRUITS`, `FruitKey`, `FruitProgress`, `FruitBells` (except via `RingBells`), `.fruits`, `.parts`, `.badges` (on
harvest / ledger / history; use `ringBadges`), `.habits`, `ticksByDate`, `.ticks`, `minutesSource`, `.minutes`
(DayRow / DayPerson: use `exerciseMin` / `exercise`), `checkin(`, `fixCheckin(`, `HOLIDAY`, `DAILY.maxTicks`,
`r.goals.activeMin`, `r.bells.perMinute`, `r.bells.strengthDay`, `r.bells.perTick`, `r.badges.activeDays`,
`r.badges.strengthDays`, `r.badges.ticks`, `habit.*` / `checkin.*` i18n keys.
