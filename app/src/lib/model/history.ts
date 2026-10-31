// きろく (docs/design.md#kiroku): every recorded week and day, with its ベル, for both people, computed on read from the
// same state as the WeekView. Pure; the UI asks for one opened week or day at a time (lazy).
import type { HarvestBonus, LocalDate, PersonId, RingBells, RingFruit, WeekKey } from '#lib/types.ts';
import { addDays, localDateAt, weekKeyOf } from '#lib/time/dates.ts';
import { exerciseMilli, manualMinutesByDay, zeroRings, type WeekEarning } from '#lib/scoring/bells.ts';
import { editableAt, finalMs, firstWeek, isLockedAt, latestAt, latestTimed, PEOPLE_IDS, provisionalMs, type State } from './state.ts';
import { dailyUpTo, dayBells, earnTimeOf, weekBells, type WeekBells } from './bells.ts';
import { replayHarvests } from './week.ts';
import { metricAsOf, weekDates, workoutsAsOf } from './inputs.ts';

/** A week's ベル at `now` (both people's daily earnings up to today, and the bonus once it landed on Sunday 19:30). */
function weekTotal(w: WeekBells, today: LocalDate, now: number): { bells: number; bonus: HarvestBonus } {
  const bonus: HarvestBonus = provisionalMs(w.weekKey) <= now ? { ...w.bonus } : { A: 0, B: 0, duo: 0 };
  return { bonus, bells: dailyUpTo(w.A, today) + dailyUpTo(w.B, today) + bonus.A + bonus.B + bonus.duo };
}
/** A future day's ベル: nothing yet, whatever rows are dated to it. */
const NO_BELLS = () => ({ bells: 0, rings: zeroRings() });

/** Badge progress per fruit: days at the goal this week, and the threshold of the week's rule version. */
type RingWeek = Record<RingFruit, { days: number; goal: number }>;
const ringWeekOf = (e: WeekEarning): RingWeek =>
  Object.fromEntries(Object.entries(e.fruits).map(([f, x]) => [f, { days: x.weekDays, goal: x.weekGoalDays }])) as RingWeek;

/** Where a day's counted exercise minutes come from: the Watch, a きろく edit of them, or workouts added by hand. */
type MinutesSource = 'watch' | 'edit' | 'manual';

/**
 * One accepted edit, derived from the event rows (docs/design.md#change-log). `person`: whose data it changed; `by`: who made it (either
 * person may edit either person's data). `before` is the value as of `at − 1`.
 */
export interface EditLog {
  at: number;
  person: PersonId;
  by: PersonId;
  date: LocalDate;
  field: 'steps' | 'exercise_min' | 'move_kcal' | 'stand_min' | 'workout_excluded' | 'workout_add';
  /** Workout type (workout_*). */
  subject?: string;
  before: number | boolean | null;
  after: number | boolean | null;
}

interface HistoryPerson {
  /** The four badges. */
  ringBadges: Record<RingFruit, boolean>;
  /** Badge progress per fruit (days at the goal / the threshold). */
  ringWeek: RingWeek;
}

export interface HistoryWeek {
  weekKey: WeekKey;
  current: boolean;
  locked: boolean;
  /** Both tapped 受け取る. */
  harvested: boolean;
  people: Record<PersonId, HistoryPerson>;
}

/**
 * A week as きろく reads it: open weeks show live numbers; a closed week shows what it had at its lock (late syncs after
 * it never count). `wb`: the week's earnings (its days' metrics and ベル).
 */
interface WeekCalc { t: number; wb: WeekBells }

function calc(s: State, wk: WeekKey, now: number): WeekCalc {
  const t = earnTimeOf(wk, now);
  return { t, wb: weekBells(s, wk, now) };
}

interface DayExercise {
  /** Counted minutes (before the daily cap): max(Watch, workouts added in きろく), never a sum. */
  value: number;
  /** The Watch value (or its edit). */
  watch: number | null;
  source: MinutesSource | null;
}

/**
 * The one exercise rule for きろく (same as earnWeek). The Watch value reads as an edit when the latest `metric_set`
 * (at ≤ t) is what metricAsOf returns, i.e. no later ingest row beat it.
 */
function dayExercise(s: State, p: PersonId, date: LocalDate, t: number, manualMin: number): DayExercise {
  const watch = metricAsOf(s, p, date, 'exercise_min', t);
  const value = Math.floor(exerciseMilli(watch, manualMin) / 1000);
  if (watch === null && manualMin === 0) return { value, watch, source: null };
  const source: MinutesSource = manualMin > (watch ?? 0) ? 'manual' : watchIsEdit(s, p, date, t) ? 'edit' : 'watch';
  return { value, watch, source };
}

/** The day's exercise minutes are a きろく edit (no later, higher ingest row beat it). */
function watchIsEdit(s: State, p: PersonId, date: LocalDate, t: number): boolean {
  const key = `${date}|exercise_min`;
  const set = latestTimed(s.metricSets[p].get(key), t);
  if (!set) return false;
  return !(s.metrics[p].get(date)?.exercise_min ?? []).some((r) => r.at > set.at && r.at <= t && r.v > set.v);
}

/** Every week from the economy's first week (or this week, before it starts) to this week, newest first. */
export function historyWeeks(s: State, now: number): HistoryWeek[] {
  const today = localDateAt(now);
  const cur = weekKeyOf(today);
  const harvested = new Set([...replayHarvests(s, now)].filter(([, by]) => by.size === 2).map(([wk]) => wk));
  const out: HistoryWeek[] = [];
  const start = firstWeek(s) < cur ? firstWeek(s) : cur;
  for (let wk = cur; wk >= start; wk = addDays(wk, -7)) {
    const { wb } = calc(s, wk, now);
    const person = (e: WeekEarning): HistoryPerson => ({ ringBadges: { ...e.badges }, ringWeek: ringWeekOf(e) });
    out.push({ weekKey: wk, current: wk === cur, locked: isLockedAt(s, wk, now), harvested: harvested.has(wk), people: { A: person(wb.A), B: person(wb.B) } });
  }
  return out;
}

// ---------- week detail ----------

/** What an accepted edit changed, for the ✎ next to that number in the week table. */
type EditedField = 'steps' | 'minutes' | 'move' | 'stand';

interface DayRow {
  date: LocalDate;
  future: boolean;
  steps: number | null;
  /** Counted exercise minutes: max(Watch, workouts added in きろく). */
  exerciseMin: number;
  /** Move, active kcal. */
  moveKcal: number | null;
  standMin: number | null;
  /** The daily goal met, per fruit. */
  met: Record<RingFruit, boolean>;
  /** What accepted edits changed on this person's day. */
  editedFields: EditedField[];
}

const FIELD_OF: Record<EditLog['field'], EditedField> = {
  steps: 'steps', exercise_min: 'minutes', move_kcal: 'move', stand_min: 'stand',
  // a workout added in きろく (or left out) changes the day's exercise minutes
  workout_excluded: 'minutes', workout_add: 'minutes'
};

interface WeekDetailPerson {
  /** The four badges. */
  ringBadges: Record<RingFruit, boolean>;
  /** Badge progress per fruit (days at the goal / the threshold). */
  ringWeek: RingWeek;
  days: DayRow[];
}

export interface WeekDetail {
  weekKey: WeekKey;
  current: boolean;
  settled: boolean;
  locked: boolean;
  open: boolean;
  /** Epoch ms of the lock (Wednesday 04:00 JST after the week). */
  lockAt: number;
  /** The week's ベル (both people, incl. the bonus once it landed) and the bonus itself. */
  bells: number;
  bonus: HarvestBonus;
  people: Record<PersonId, WeekDetailPerson>;
}

function editedFields(s: State, person: PersonId): Map<LocalDate, Set<EditedField>> {
  const out = new Map<LocalDate, Set<EditedField>>();
  for (const e of editLog(s)) if (e.person === person) (out.get(e.date) ?? out.set(e.date, new Set()).get(e.date)!).add(FIELD_OF[e.field]);
  return out;
}

export function weekDetail(s: State, wk: WeekKey, now: number): WeekDetail {
  const today = localDateAt(now);
  const c = calc(s, wk, now);
  const wb = c.wb;
  const b = weekTotal(wb, today, now);
  const person = (p: PersonId): WeekDetailPerson => {
    const edited = editedFields(s, p);
    return {
      ringBadges: { ...wb[p].badges },
      ringWeek: ringWeekOf(wb[p]),
      days: wb[p].days.map((d) => ({
        date: d.date,
        future: d.date > today,
        steps: d.steps,
        exerciseMin: d.exerciseMin,
        moveKcal: d.moveKcal,
        standMin: d.standMin,
        met: { ...d.met },
        editedFields: [...(edited.get(d.date) ?? [])]
      }))
    };
  };
  return {
    weekKey: wk,
    current: wk === weekKeyOf(today),
    settled: wk >= firstWeek(s) && provisionalMs(wk) <= now,
    locked: isLockedAt(s, wk, now),
    open: editableAt(wk, now),
    lockAt: finalMs(wk),
    bells: b.bells,
    bonus: b.bonus,
    people: { A: person('A'), B: person('B') }
  };
}

// ---------- day detail ----------

/** A workout added in きろく that day; `excluded`: left out since (its minutes no longer count). */
interface DayWorkout { id: string; type: string; durationMin: number; excluded: boolean }

export interface DayPerson {
  /** The day's ベル, per ring fruit. */
  bells: number;
  rings: RingBells;
  /** The daily goal met, per fruit. */
  met: Record<RingFruit, boolean>;
  steps: { value: number | null; edited: boolean };
  /** Counted exercise minutes, the Watch value and where the counted number comes from. */
  exercise: { value: number; watch: number | null; source: MinutesSource | null; edited: boolean };
  /** Move: active kcal and the goal in force that day. */
  move: { value: number | null; goal: number; edited: boolean };
  /** Stand minutes. */
  stand: { value: number | null; edited: boolean };
  workouts: DayWorkout[];
}

export interface DayDetail {
  date: LocalDate;
  future: boolean;
  /** Edits to this day count now. */
  open: boolean;
  lockAt: number;
  people: Record<PersonId, DayPerson>;
  /** Accepted edits of this day, both people, newest first. */
  edits: EditLog[];
}

export function dayDetail(s: State, date: LocalDate, now: number): DayDetail {
  const wk = weekKeyOf(date);
  const c = calc(s, wk, now);
  const wb = c.wb;
  const log = editLog(s).filter((e) => e.date === date);
  const person = (p: PersonId): DayPerson => {
    const t = c.t;
    const counted = workoutsAsOf(s, p, t, weekDates(wk));
    const m = dayExercise(s, p, date, t, manualMinutesByDay(counted).get(date) ?? 0);
    const d = wb[p].days.find((x) => x.date === date);
    const countedIds = new Set(counted.map((w) => w.id));
    const workouts = s.workouts[p]
      .filter((w) => w.date === date && w.at <= t)
      .map((w): DayWorkout => ({ id: w.id, type: w.type, durationMin: w.durationMin, excluded: !countedIds.has(w.id) }));
    const mine = log.filter((e) => e.person === p);
    const exercise = { ...m, edited: mine.some((e) => e.field === 'exercise_min') };
    return {
      ...(date <= localDateAt(now) ? dayBells(wb[p], date) : NO_BELLS()),
      met: d ? { ...d.met } : { pear: false, peach: false, cherry: false, apple: false },
      steps: { value: metricAsOf(s, p, date, 'steps', t), edited: mine.some((e) => e.field === 'steps') },
      exercise,
      move: { value: metricAsOf(s, p, date, 'move_kcal', t), goal: d?.moveGoal ?? 0, edited: mine.some((e) => e.field === 'move_kcal') },
      stand: { value: metricAsOf(s, p, date, 'stand_min', t), edited: mine.some((e) => e.field === 'stand_min') },
      workouts
    };
  };
  return {
    date, future: date > localDateAt(now), open: editableAt(date, now),
    lockAt: finalMs(wk), people: { A: person('A'), B: person('B') }, edits: [...log].reverse()
  };
}

// ---------- the change log ----------

const logs = new WeakMap<State, EditLog[]>();

/**
 * Every accepted edit in server order (the sheet stays the raw audit; refused edits and no-op edits never show).
 * Memoised per State (a State is never mutated).
 */
export function editLog(s: State): EditLog[] {
  let out = logs.get(s);
  if (!out) logs.set(s, (out = buildEditLog(s)));
  return out;
}

function buildEditLog(s: State): EditLog[] {
  const out: EditLog[] = [];
  for (const p of PEOPLE_IDS) {
    for (const [key, list] of s.metricSets[p]) {
      const [date, field] = key.split('|') as [LocalDate, 'steps' | 'exercise_min' | 'move_kcal' | 'stand_min'];
      for (const e of list) {
        const before = metricAsOf(s, p, date, field, e.at - 1);
        const after = metricAsOf(s, p, date, field, e.at);
        if (before !== after) out.push({ at: e.at, person: p, by: e.by, date, field, before, after });
      }
    }
    for (const w of s.workouts[p]) {
      out.push({ at: w.at, person: p, by: w.by, date: w.date, field: 'workout_add', subject: w.type, before: null, after: w.durationMin });
    }
  }
  const byId = new Map<string, { date: LocalDate; type: string }>();
  for (const p of PEOPLE_IDS) for (const w of s.workouts[p]) byId.set(`${p}|${w.id}`, w);
  for (const e of s.workoutEdits) {
    const w = byId.get(`${e.person}|${e.id}`);
    if (!w) continue;
    const was = latestAt(s.workoutExcluded.get(`${e.person}|${e.id}`), e.at - 1) ?? false;
    if (was !== e.excluded) out.push({ at: e.at, person: e.person, by: e.by, date: w.date, field: 'workout_excluded', subject: w.type, before: was, after: e.excluded });
  }
  return out.sort((x, y) => x.at - y.at);
}

/** The accepted edits of one week (both people), newest first. */
export const weekEdits = (s: State, wk: WeekKey): EditLog[] => editLog(s).filter((e) => weekKeyOf(e.date) === wk).reverse();

// ---------- ベル ledger: model/bells.ts ----------

export { bellsLedger, type BellsLedger, type LedgerBonus, type LedgerDay, type LedgerSpend } from './bells.ts';
