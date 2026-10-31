// Cache compaction for `metrics` rows: with frequent (≈ hourly) Shortcut runs a day collects ~20 rows per person and metric,
// but once its week has locked (Wednesday 04:00) the model only ever reads that day's value at a few fixed times.
// Keeping the row that answers each of those times leaves the views unchanged and drops ~90% of the rows.
//
// A day's value as of T is its latest row stamped at or before T (`metricAsOf`, `latestAt`; rows sorted by `at`, ties
// in sheet order). A locked week's earnings read it as of the lock, so per (person, date, metric) the latest row at
// or before the lock is kept, and the latest overall (the day's current value). Weight is read only as of now, so
// only its newest row per (person, date) is kept.
import type { PersonId } from '#lib/types.ts';
import { DATE_RE, type MetricRow, type SnapshotRows } from '#lib/contract/api.ts';
import { weekKeyOf } from '#lib/time/dates.ts';
import { finalMs } from './state.ts';
import { rowAt } from './snapshot.ts';

/**
 * `rows` with the metrics of locked weeks (as of `now`) reduced to the rows the model can still read: per
 * (person, date, metric), the latest row at or before the Wednesday 04:00 lock (the week's earnings are fixed there)
 * and the latest overall (late syncs), and per person the newest row (`lastSync`). Rows of open weeks, rows the model would
 * skip anyway, and the other tabs are kept as they are. Order is preserved. Pure; returns `rows` itself
 * when nothing was dropped.
 */
export function compactRows(rows: SnapshotRows, now: number): SnapshotRows {
  const groups = new Map<string, { row: MetricRow; at: number; i: number }[]>();
  const keep = new Set<number>();
  const newest: Partial<Record<PersonId, { at: number; i: number }>> = {};
  rows.metrics.forEach((row, i) => {
    const at = rowAt(row);
    const date = String(row[2]);
    if (at === null || !DATE_RE.test(date) || !Number.isFinite(Number(row[4])) || now < finalMs(weekKeyOf(date))) {
      keep.add(i);
      return;
    }
    const p = row[1];
    if (!newest[p] || at >= newest[p]!.at) newest[p] = { at, i };
    const k = `${p}|${date}|${row[3]}`;
    (groups.get(k) ?? groups.set(k, []).get(k)!).push({ row, at, i });
  });
  for (const n of Object.values(newest)) if (n) keep.add(n.i);
  /** The latest row stamped at or before t (a tie: the later one in the list, as the model's stable sort reads it). */
  const latestBy = (list: { at: number; i: number }[], t: number) => {
    let last: { at: number; i: number } | null = null;
    for (const x of list) if (x.at <= t && (!last || x.at >= last.at)) last = x;
    if (last) keep.add(last.i);
  };
  for (const list of groups.values()) {
    latestBy(list, Infinity);
    if (list[0].row[3] !== 'weight') latestBy(list, finalMs(weekKeyOf(String(list[0].row[2]))));
  }
  if (keep.size === rows.metrics.length) return rows;
  return { ...rows, metrics: rows.metrics.filter((_, i) => keep.has(i)) };
}
