// きろく (history-and-editing.md): every recorded week and day, with its ベル, for both people, computed on read from the
// same state as the WeekView. Pure; the UI asks for one opened week or day at a time (lazy).
import type { FruitBells, FruitKey, HarvestBonus, LocalDate, PersonId, WeekKey } from '#lib/types.ts';
import { DAILY, STRENGTH } from '#lib/config/rules.ts';
import { PLACES } from '#lib/config/places.ts';
import { addDays, habitsFor, isStrengthWorkout, manualMinutesByDay, minuteSourcesMilli, weekDays, weekKeyOf } from '#lib/scoring/index.ts';
import { allWorkouts, editableAt, finalMs, firstWeek, isLockedAt, latestAt, latestTimed, localDateAt, PEOPLE_IDS, provisionalMs, type State } from './state.ts';
import { rulesFor } from '#lib/scoring/targets.ts';
import type { WeekEarning } from '#lib/scoring/bells.ts';
import { dailyUpTo, earnInput, earnTimeOf, weekBells, type WeekBells } from './bells.ts';
import { activityAsOf, metricAsOf, replayHarvests, weekDates, workoutsAsOf, type Activity } from './week.ts';

const LIVE = Infinity;

/** A week's ベル at `now`: daily earnings up to today, and the bonus once it landed (Sunday 19:30). */
function weekBellsView(w: WeekBells, today: LocalDate, now: number) {
  const landed = provisionalMs(w.weekKey) <= now;
  const bonus: HarvestBonus = landed ? { ...w.bonus } : { A: 0, B: 0, duo: 0 };
  const person = (e: WeekEarning) => ({ daily: dailyUpTo(e, today), bonus: bonus[e.person], badges: { ...e.badges } });
  const A = person(w.A);
  const B = person(w.B);
  return { bonus, A, B, bells: A.daily + A.bonus + B.daily + B.bonus + bonus.duo };
}
const dayOf = (e: WeekEarning, date: LocalDate): { bells: number; parts: FruitBells } => {
  const d = e.days.find((x) => x.date === date);
  return d ? { bells: d.bells, parts: { ...d.parts } } : { bells: 0, parts: { peach: 0, coconut: 0, apple: 0, pear: 0 } };
};

export type Stamp = 'strength' | 'active' | 'none' | 'future';
/** Where a day's counted minutes come from: the Watch, a きろく edit of them, the steps, or workouts added by hand. */
type MinutesSource = 'watch' | 'edit' | 'steps' | 'manual';

/** One accepted edit, derived from the event rows (§4.4). `before` is the value as of `at − 1`. */
export interface EditLog {
  at: number;
  by: PersonId;
  date: LocalDate;
  field: 'steps' | 'exercise_min' | 'workout_strength' | 'workout_excluded' | 'workout_add' | 'checkin';
  /** Workout type (workout_*) or habit key (checkin). */
  subject?: string;
  before: number | boolean | null;
  after: number | boolean | null;
}

interface HistoryPerson {
  /** The person's ベル of the week: daily earnings + their badge bonus once it landed. */
  bells: number;
  badges: Record<FruitKey, boolean>;
  stamps: Stamp[];
}

export interface HistoryWeek {
  weekKey: WeekKey;
  current: boolean;
  /** Sunday 19:30 has passed: the harvest opened and the weekly bonus landed. */
  settled: boolean;
  locked: boolean;
  /** Edits for this week count right now. */
  open: boolean;
  /** Both tapped 壺に入れる. */
  harvested: boolean;
  /** The week's ベル, both people: daily earnings + the weekly bonus once it landed (Sunday 19:30). */
  bells: number;
  people: Record<PersonId, HistoryPerson>;
}

/**
 * A week as きろく reads it: open weeks show live numbers; a closed week shows what it had at its lock (late syncs after
 * it never count). `wb`: the week's earnings (its days' strength, ticks and ベル).
 */
interface WeekCalc { t: number; act: Record<PersonId, Activity>; wb: WeekBells }

function calc(s: State, wk: WeekKey, now: number): WeekCalc {
  const t = earnTimeOf(wk, now);
  const act = { A: activityAsOf(s, 'A', t, weekDates(wk)), B: activityAsOf(s, 'B', t, weekDates(wk)) };
  return { t, act, wb: weekBells(s, wk, now, t === LIVE ? act : undefined) };
}

/** The person's strength days of the week (as the earnings count them). */
const strengthDays = (c: WeekCalc, p: PersonId): Set<LocalDate> => new Set(c.wb[p].days.filter((d) => d.strength).map((d) => d.date));

interface DayMinutes {
  /** Counted minutes (before the daily cap): max(Watch, step-derived, manual workouts), never a sum (ADR 0011). */
  value: number;
  /** The Watch value (or its edit). */
  watch: number | null;
  source: MinutesSource | null;
}

/**
 * The one minutes rule for きろく (same as earnWeek): the largest of the three sources. The Watch value reads as an
 * edit when the latest `metric_set` (at ≤ t) is what metricAsOf returns, i.e. no later ingest row beat it (round 7 L4).
 */
function dayMinutes(s: State, p: PersonId, date: LocalDate, t: number, steps: number | null, manualMin: number): DayMinutes {
  const watch = metricAsOf(s, p, date, 'exercise_min', t);
  const src = minuteSourcesMilli(steps, watch, manualMin, rulesFor(weekKeyOf(date)).goals.steps);
  const best = Math.max(src.watch, src.steps, src.manual);
  const value = Math.floor(best / 1000);
  if (steps === null && watch === null && manualMin === 0) return { value, watch, source: null };
  let source: MinutesSource;
  if (best > 0 && best === src.manual && src.manual > src.watch) source = 'manual';
  else if (best > 0 && best === src.steps && src.steps > src.watch) source = 'steps';
  else source = watchIsEdit(s, p, date, t) ? 'edit' : 'watch';
  return { value, watch, source };
}

function watchIsEdit(s: State, p: PersonId, date: LocalDate, t: number): boolean {
  const key = `${date}|exercise_min`;
  const set = latestTimed(s.metricSets[p].get(key), t);
  if (!set) return false;
  return !(s.metrics[p].get(key) ?? []).some((r) => r.at > set.at && r.at <= t && r.v > set.v);
}

/** Manual workout minutes per day for a person as of t (excluded ones don't count). */
const manualAsOf = (act: Activity): Map<LocalDate, number> => manualMinutesByDay(act.workouts);

function stampsFor(s: State, person: PersonId, wk: WeekKey, c: WeekCalc, today: LocalDate): Stamp[] {
  const goal = rulesFor(wk).goals.steps;
  const strength = strengthDays(c, person);
  const manual = manualAsOf(c.act[person]);
  return weekDays(wk).map((date) => {
    if (date > today) return 'future';
    if (strength.has(date)) return 'strength';
    const steps = metricAsOf(s, person, date, 'steps', c.t);
    const { value } = dayMinutes(s, person, date, c.t, steps, manual.get(date) ?? 0);
    return (steps !== null && steps >= goal) || value >= DAILY.activeDayMin ? 'active' : 'none';
  });
}

/** Every week from the economy's first week (or this week, before it starts) to this week, newest first. */
export function historyWeeks(s: State, now: number): HistoryWeek[] {
  const today = localDateAt(now);
  const cur = weekKeyOf(today);
  const harvested = new Set([...replayHarvests(s, now)].filter(([, by]) => by.size === 2).map(([wk]) => wk));
  const out: HistoryWeek[] = [];
  const start = firstWeek(s) < cur ? firstWeek(s) : cur;
  for (let wk = cur; wk >= start; wk = addDays(wk, -7)) {
    const c = calc(s, wk, now);
    const b = weekBellsView(c.wb, today, now);
    out.push({
      weekKey: wk,
      current: wk === cur,
      settled: wk >= firstWeek(s) && provisionalMs(wk) <= now,
      locked: isLockedAt(s, wk, now),
      open: editableAt(wk, now), // this week, and last week until Wednesday 04:00
      harvested: harvested.has(wk),
      bells: b.bells,
      people: {
        A: { bells: b.A.daily + b.A.bonus, badges: b.A.badges, stamps: stampsFor(s, 'A', wk, c, today) },
        B: { bells: b.B.daily + b.B.bonus, badges: b.B.badges, stamps: stampsFor(s, 'B', wk, c, today) }
      }
    });
  }
  return out;
}

// ---------- week detail ----------

/** What an accepted edit changed, for the ✎ next to that number in the week table. */
type EditedField = 'steps' | 'minutes' | 'workout' | 'ticks';

interface DayRow {
  date: LocalDate;
  future: boolean;
  steps: number | null;
  /** Counted minutes (max of Watch, step-derived and manual workouts). */
  minutes: number;
  minutesSource: MinutesSource | null;
  strength: boolean;
  ticks: number;
  /** The day's ベル and its parts per fruit. */
  bells: number;
  parts: FruitBells;
  /** An accepted edit touched this person's day. */
  edited: boolean;
  editedFields: EditedField[];
}

const FIELD_OF: Record<EditLog['field'], EditedField> = {
  steps: 'steps', exercise_min: 'minutes', workout_strength: 'workout', workout_excluded: 'workout', workout_add: 'workout', checkin: 'ticks'
};

interface WeekDetailPerson {
  /** Daily earnings of the week (without the bonus). */
  dailyBells: number;
  /** The badge bonus (+500 each; 0 until it lands on Sunday 19:30). */
  bonus: number;
  badges: Record<FruitKey, boolean>;
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
  for (const e of editLog(s)) if (e.by === person) (out.get(e.date) ?? out.set(e.date, new Set()).get(e.date)!).add(FIELD_OF[e.field]);
  return out;
}

export function weekDetail(s: State, wk: WeekKey, now: number): WeekDetail {
  const today = localDateAt(now);
  const c = calc(s, wk, now);
  const wb = c.wb;
  const b = weekBellsView(wb, today, now);
  const person = (p: PersonId): WeekDetailPerson => {
    const input = earnInput(s, p, wk, c.t, c.act[p]);
    const edited = editedFields(s, p);
    const manual = manualAsOf(c.act[p]);
    const strength = strengthDays(c, p);
    return {
      dailyBells: b[p].daily,
      bonus: b[p].bonus,
      badges: b[p].badges,
      days: input.days.map((d) => {
        const m = dayMinutes(s, p, d.date, c.t, d.steps, manual.get(d.date) ?? 0);
        const fields = [...(edited.get(d.date) ?? [])];
        return {
          date: d.date,
          future: d.date > today,
          steps: d.steps,
          minutes: m.value,
          minutesSource: m.source,
          strength: strength.has(d.date),
          ticks: Math.min(DAILY.maxTicks, new Set(input.checkins.filter((x) => x.date === d.date).map((x) => x.habit)).size),
          ...(d.date <= today ? dayOf(wb[p], d.date) : dayOf(wb[p], '')),
          edited: fields.length > 0,
          editedFields: fields
        };
      })
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

interface DayWorkout {
  id: string;
  type: string;
  startAt: string;
  durationMin: number;
  /** Counts as a strength workout now. */
  strength: boolean;
  /** The きろく override (absent = automatic). */
  override: boolean | null;
  excluded: boolean;
  manual: boolean;
  /** Long enough to count as strength at all. */
  eligible: boolean;
}

/** A gym arrival: always a strength day. */
interface DayVisit { id: string; place: string; arriveAt: string }

export interface DayPerson {
  /** The day's ベル and its parts per fruit. */
  bells: number;
  parts: FruitBells;
  steps: { value: number | null; edited: boolean };
  /** Counted minutes, the Watch value and where the counted number comes from. */
  minutes: { value: number; watch: number | null; source: MinutesSource | null; edited: boolean };
  workouts: DayWorkout[];
  visits: DayVisit[];
  habits: { keys: [string, string, string]; done: string[] };
}

export interface DayDetail {
  date: LocalDate;
  weekKey: WeekKey;
  future: boolean;
  locked: boolean;
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
  const places = new Map(PLACES.map((p) => [p.key, p.name]));
  const log = editLog(s).filter((e) => e.date === date);
  const person = (p: PersonId): DayPerson => {
    const t = c.t;
    const steps = metricAsOf(s, p, date, 'steps', t);
    const m = dayMinutes(s, p, date, t, steps, manualAsOf(c.act[p]).get(date) ?? 0);
    const counted = new Map(c.act[p].workouts.map((w) => [w.id, w]));
    const workouts = allWorkouts(s, p)
      .filter((w) => w.date === date && w.at <= t)
      .sort((x, y) => x.startAt.localeCompare(y.startAt))
      .map((w): DayWorkout => {
        const key = `${p}|${w.id}`;
        const live = counted.get(w.id);
        return {
          id: w.id, type: w.type, startAt: w.startAt, durationMin: w.durationMin,
          strength: !!live && isStrengthWorkout(live), override: latestAt(s.workoutStrength.get(key), t) ?? null,
          excluded: !live, manual: !!w.manual, eligible: w.durationMin >= STRENGTH.minWorkoutMin
        };
      });
    const visits = c.act[p].visits.filter((v) => v.date === date).map((v): DayVisit => ({
      id: v.id, place: places.get(v.placeKey) ?? v.placeKey, arriveAt: v.arriveAt
    }));
    const input = earnInput(s, p, wk, t, c.act[p]);
    const mine = log.filter((e) => e.by === p);
    return {
      ...(date <= localDateAt(now) ? dayOf(wb[p], date) : dayOf(wb[p], '')),
      steps: { value: steps, edited: mine.some((e) => e.field === 'steps') },
      minutes: { ...m, edited: mine.some((e) => e.field === 'exercise_min') },
      workouts,
      visits,
      habits: { keys: [...habitsFor(p, wk)] as [string, string, string], done: input.checkins.filter((x) => x.date === date).map((x) => x.habit) }
    };
  };
  return {
    date, weekKey: wk, future: date > localDateAt(now), locked: isLockedAt(s, wk, now), open: editableAt(date, now),
    lockAt: finalMs(wk), people: { A: person('A'), B: person('B') }, edits: [...log].reverse()
  };
}

// ---------- the change log ----------

const logs = new WeakMap<State, EditLog[]>();

/**
 * Every accepted edit in server order (the sheet stays the raw audit; refused edits and no-op edits never show).
 * Memoised per State (a State is never mutated; round 7 L5).
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
      const [date, field] = key.split('|') as [LocalDate, 'steps' | 'exercise_min'];
      for (const e of list) {
        const before = metricAsOf(s, p, date, field, e.at - 1);
        const after = metricAsOf(s, p, date, field, e.at);
        if (before !== after) out.push({ at: e.at, by: p, date, field, before, after });
      }
    }
    const ticks = new Map<string, State['checkins'][PersonId]>();
    for (const c of s.checkins[p]) {
      const k = `${c.date}|${c.habit}`;
      const earlier = ticks.get(k) ?? ticks.set(k, []).get(k)!;
      if (c.edit) {
        const before = earlier.findLast((x) => x.at < c.at)?.done ?? false;
        if (before !== c.done) out.push({ at: c.at, by: p, date: c.date, field: 'checkin', subject: c.habit, before, after: c.done });
      }
      earlier.push(c);
    }
    for (const w of s.manualWorkouts[p]) out.push({ at: w.at, by: p, date: w.date, field: 'workout_add', subject: w.type, before: null, after: w.durationMin });
  }
  const byId = new Map<string, { date: LocalDate; type: string; at: number }>();
  for (const p of PEOPLE_IDS) for (const w of allWorkouts(s, p)) byId.set(`${p}|${w.id}`, w);
  for (const e of s.workoutEdits) {
    const w = byId.get(`${e.person}|${e.id}`);
    if (!w) continue;
    if (e.at === w.at) continue; // the strength choice made with a workout_add is part of the add
    const counts = (t: number) => {
      const wo = workoutsAsOf(s, e.person, t, { from: w.date, to: w.date }).find((x) => x.id === e.id);
      return !!wo && isStrengthWorkout(wo);
    };
    if (e.excluded !== undefined) {
      const was = latestAt(s.workoutExcluded.get(`${e.person}|${e.id}`), e.at - 1) ?? false;
      if (was !== e.excluded) out.push({ at: e.at, by: e.person, date: w.date, field: 'workout_excluded', subject: w.type, before: was, after: e.excluded });
    }
    if (e.strength !== undefined) {
      const before = counts(e.at - 1);
      const after = counts(e.at);
      if (before !== after) out.push({ at: e.at, by: e.person, date: w.date, field: 'workout_strength', subject: w.type, before, after });
    }
  }
  return out.sort((x, y) => x.at - y.at);
}

/** The accepted edits of one week (both people), newest first. */
export const weekEdits = (s: State, wk: WeekKey): EditLog[] => editLog(s).filter((e) => weekKeyOf(e.date) === wk).reverse();

// ---------- ベル ledger (ADR 0019): model/bells.ts ----------

export { bellsLedger, type BellsLedger, type LedgerBonus, type LedgerDay, type LedgerSpend } from './bells.ts';
