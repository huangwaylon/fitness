// Cache compaction for `metrics` rows: with frequent (≈ hourly) Shortcut runs a day collects ~20 rows per person and metric,
// but once its week has locked (Wednesday 04:00) the model only ever reads that day's value at a few fixed times.
// Keeping the row that answers each of those times leaves the views unchanged and drops ~90% of the rows.
//
// It relies on the sheet's invariant that ingest rows for a (person, date, metric) only go up over time (the server
// appends only higher values), so "the row with the largest value at or before T" answers every read at T
// (`metricAsOf`). A hand edit that breaks it bumps `rev`, and the client then refetches everything
// (docs/backend.md#revision).
//
// Weight rows are the exception: a day's weight is its LATEST row (the server appends whenever the day's Body Mass
// differs from its last row, up or down), and the model only reads it as of now. So per (person, date) only the
// newest `weight` row is kept, never "the largest".
import type { PersonId } from '#lib/types.ts';
import { DATE_RE, type MetricRow, type SnapshotRows } from '#lib/contract/api.ts';
import { weekKeyOf } from '#lib/time/dates.ts';
import { finalMs } from './state.ts';
import { rowAt } from './snapshot.ts';

/**
 * `rows` with the metrics of locked weeks (as of `now`) reduced to the rows the model can still read: per
 * (person, date, metric), the best row at or before the Wednesday 04:00 lock (the week's earnings are fixed there) and
 * the best overall (late syncs), and per person the newest row (`lastSync`). Rows of open weeks, rows the model would
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
  for (const list of groups.values()) {
    if (list[0].row[3] === 'weight') {
      let last = list[0];
      for (const x of list) if (x.at >= last.at) last = x;
      keep.add(last.i);
      continue;
    }
    const wk = weekKeyOf(String(list[0].row[2]));
    for (const t of [finalMs(wk), Infinity]) {
      let best: { v: number; at: number; i: number } | null = null;
      for (const { row, at, i } of list) {
        const v = Number(row[4]);
        if (at <= t && (!best || v > best.v || (v === best.v && at > best.at))) best = { v, at, i };
      }
      if (best) keep.add(best.i);
    }
  }
  if (keep.size === rows.metrics.length) return rows;
  return { ...rows, metrics: rows.metrics.filter((_, i) => keep.has(i)) };
}
