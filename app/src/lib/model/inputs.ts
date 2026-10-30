// The rows of one person as of a time T (only rows the server stamped at or before T): the inputs of the ベル
// earnings. Shared by the WeekView (week.ts), the ベル economy (bells.ts) and きろく (history.ts).
import type { LocalDate, PersonId, Visit, WeekKey, Workout } from '#lib/types.ts';
import { addDays } from '#lib/scoring/index.ts';
import type { ActivityMetric } from '#lib/contract/api.ts';
import { allWorkouts, latestAt, latestTimed, type State } from './state.ts';

type VisitRec = Visit & { id: string };

/** An inclusive date window; the default is all time. Every per-week caller passes its week (perf: weeks × rows). */
export interface Dates { from: LocalDate; to: LocalDate }
const ALL: Dates = { from: '0000-00-00', to: '9999-99-99' };
export const weekDates = (wk: WeekKey): Dates => ({ from: wk, to: addDays(wk, 6) });

/** Ingested + manual workouts as of T, without the ones excluded from scoring, with their きろく strength mark. */
export function workoutsAsOf(s: State, person: PersonId, t: number, dates: Dates = ALL): Workout[] {
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
function visitsAsOf(s: State, person: PersonId, t: number, dates: Dates = ALL): VisitRec[] {
  return s.presence[person]
    .filter((e) => e.at <= t && e.date >= dates.from && e.date <= dates.to)
    .sort((x, y) => x.eventMs - y.eventMs)
    .map((e) => ({ id: e.id, placeKey: e.placeKey, date: e.date, arriveAt: e.eventAt }));
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

export interface Activity { workouts: Workout[]; visits: VisitRec[] }

export function activityAsOf(s: State, person: PersonId, t: number, dates: Dates): Activity {
  return { workouts: workoutsAsOf(s, person, t, dates), visits: visitsAsOf(s, person, t, dates) };
}

