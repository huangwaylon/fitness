// The rows of one person as of a time T (only rows the server stamped at or before T): the inputs of the ベル
// earnings. Shared by the WeekView (week.ts), the ベル economy (bells.ts) and きろく (history.ts).
import type { LocalDate, PersonId, WeekKey, Workout } from '#lib/types.ts';
import { addDays } from '#lib/time/dates.ts';
import type { ActivityMetric } from '#lib/contract/api.ts';
import { latestAt, latestTimed, type State } from './state.ts';

/** An inclusive date window (every caller passes one: perf is weeks × rows). */
export interface Dates { from: LocalDate; to: LocalDate }
export const weekDates = (wk: WeekKey): Dates => ({ from: wk, to: addDays(wk, 6) });

/** The workouts added in きろく as of T, without the ones excluded since. */
export function workoutsAsOf(s: State, person: PersonId, t: number, dates: Dates): Workout[] {
  const out: Workout[] = [];
  for (const w of s.workouts[person]) {
    if (w.at > t || w.date < dates.from || w.date > dates.to) continue;
    if (latestAt(s.workoutExcluded.get(`${person}|${w.id}`), t) === true) continue;
    out.push({ id: w.id, date: w.date, type: w.type, durationMin: w.durationMin });
  }
  return out;
}

/**
 * A day's metric as of T (docs/design.md#how-edits-apply). Ingest rows are append-only and higher-only, so their max ≤ T
 * is the latest value (and robust to a hand-edited sheet). A `metric_set` S (the latest with at ≤ T) overrides it, even
 * lower, but a later and higher sync still wins: max(S, ingest rows with S.at < at ≤ T).
 */
export function metricAsOf(s: State, person: PersonId, date: LocalDate, metric: ActivityMetric, t: number): number | null {
  const key = `${date}|${metric}`;
  const set = latestTimed(s.metricSets[person].get(key), t);
  let best: number | null = set ? set.v : null;
  const after = set ? set.at : -Infinity;
  const rows = s.metrics[person].get(key);
  if (rows) for (const r of rows) if (r.at <= t && r.at > after && (best === null || r.v > best)) best = r.v;
  return best;
}


