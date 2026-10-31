// The rows of one person as of a time T (only rows the server stamped at or before T): the inputs of the ベル
// earnings. Shared by the ベル economy (bells.ts) and きろく (history.ts).
import type { LocalDate, PersonId } from '#lib/types.ts';
import type { ActivityMetric } from '#lib/contract/api.ts';
import { latestAt, type State } from './state.ts';

/**
 * A day's metric as of T: its latest ingest row stamped ≤ T. Apple Health is the source of truth and the server appends
 * a row whenever the day's total differs from its last row (up or down), so the latest row is Health's value at T. A
 * locked week reads it as of its lock (bells.ts), so a later sync never moves its earnings.
 */
export function metricAsOf(s: State, person: PersonId, date: LocalDate, metric: ActivityMetric, t: number): number | null {
  return latestAt(s.metrics[person].get(date)?.[metric], t) ?? null;
}
