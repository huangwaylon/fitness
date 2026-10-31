// The rows of one person as of a time T (only rows the server stamped at or before T): the inputs of the ベル
// earnings. Shared by the ベル economy (bells.ts) and きろく (history.ts).
import type { LocalDate, PersonId } from '#lib/types.ts';
import type { ActivityMetric } from '#lib/contract/api.ts';
import type { State } from './state.ts';

/**
 * A day's metric as of T: the max of its ingest rows stamped ≤ T. Ingest rows are append-only and higher-only, so
 * that is the latest value from Apple Health (and robust to a hand-edited sheet).
 */
export function metricAsOf(s: State, person: PersonId, date: LocalDate, metric: ActivityMetric, t: number): number | null {
  let best: number | null = null;
  const rows = s.metrics[person].get(date)?.[metric];
  if (rows) for (const r of rows) if (r.at <= t && (best === null || r.v > best)) best = r.v;
  return best;
}
