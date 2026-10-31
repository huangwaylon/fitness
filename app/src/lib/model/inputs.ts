// The rows of one person as of a time T (only rows the server stamped at or before T): the inputs of the ベル
// earnings. Shared by the WeekView (week.ts), the ベル economy (bells.ts) and きろく (history.ts).
import type { GymArrival, LocalDate, PersonId, WeekKey, Workout } from '#lib/types.ts';
import { addDays } from '#lib/time/dates.ts';
import type { ActivityMetric } from '#lib/contract/api.ts';
import { gymDaysOf } from '#lib/scoring/bells.ts';
import { allWorkouts, latestAt, latestTimed, type State } from './state.ts';

/** An inclusive date window (every caller passes one: perf is weeks × rows). */
export interface Dates { from: LocalDate; to: LocalDate }
export const weekDates = (wk: WeekKey): Dates => ({ from: wk, to: addDays(wk, 6) });

/** Ingested + manual workouts as of T, without the ones excluded from scoring, with their きろく strength mark. */
export function workoutsAsOf(s: State, person: PersonId, t: number, dates: Dates): Workout[] {
  const out: Workout[] = [];
  for (const w of allWorkouts(s, person)) {
    if (w.at > t || w.date < dates.from || w.date > dates.to) continue;
    const key = `${person}|${w.id}`;
    if (latestAt(s.workoutExcluded.get(key), t) === true) continue;
    const wo: Workout = {
      id: w.id, date: w.date, type: w.type, startAt: w.startAt, endAt: w.endAt, durationMin: w.durationMin, avgHr: w.avgHr
    };
    if (w.manual) wo.manual = true;
    const override = latestAt(s.workoutStrength.get(key), t);
    if (override !== undefined && override !== null) wo.strengthOverride = override;
    out.push(wo);
  }
  return out;
}

/** Gym arrivals as of T whose date falls in `dates`, in time order (each one is a strength day). */
function arrivalsAsOf(s: State, person: PersonId, t: number, dates: Dates): GymArrival[] {
  return s.gym[person]
    .filter((e) => e.at <= t && e.date >= dates.from && e.date <= dates.to)
    .sort((x, y) => x.arrivedMs - y.arrivedMs)
    .map((e) => ({ id: e.id, label: e.label, date: e.date, arriveAt: e.arrivedAt }));
}

/**
 * A day's metric as of T (history-and-editing.md §4.1). Ingest rows are append-only and higher-only, so their max ≤ T
 * is the latest value (and robust to a hand-edited sheet). A `metric_set` S (the latest with at ≤ T) overrides it, even
 * lower, but a later and higher sync still wins: max(S, ingest rows with S.at < at ≤ T).
 */
export function metricAsOf(s: State, person: PersonId, date: LocalDate, metric: ActivityMetric, t: number): number | null {
  const set = latestTimed(s.metricSets[person].get(`${date}|${metric}`), t);
  let best: number | null = set ? set.v : null;
  const after = set ? set.at : -Infinity;
  for (const r of s.metrics[person].get(`${date}|${metric}`) ?? []) if (r.at <= t && r.at > after && (best === null || r.v > best)) best = r.v;
  return best;
}

export interface Activity { workouts: Workout[]; arrivals: GymArrival[] }

export function activityAsOf(s: State, person: PersonId, t: number, dates: Dates): Activity {
  return { workouts: workoutsAsOf(s, person, t, dates), arrivals: arrivalsAsOf(s, person, t, dates) };
}


/** The day's `gym_set` as of T (ADR 0023): true / false by hand, or null (automatic: arrivals and strength workouts). */
export const gymSetAsOf = (s: State, person: PersonId, date: LocalDate, t: number): boolean | null =>
  latestAt(s.gymSets[person].get(date), t) ?? null;

/** Whether `date` is a 🥥 day for `person` as of T: the same rule as earnWeek (scoring/bells.ts gymDaysOf). */
export function gymDayAsOf(s: State, person: PersonId, date: LocalDate, t: number): boolean {
  const dates = { from: date, to: date };
  const set = gymSetAsOf(s, person, date, t);
  return gymDaysOf(workoutsAsOf(s, person, t, dates), arrivalsAsOf(s, person, t, dates), set === null ? undefined : new Map([[date, set]])).has(date);
}
