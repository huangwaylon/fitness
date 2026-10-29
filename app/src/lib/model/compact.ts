// Cache compaction for `metrics` rows (round 9): with hourly syncs a day collects ~20 rows per person and metric,
// but once its week has locked (Wednesday 04:00) the model only ever reads that day's value at a few fixed times.
// Keeping the row that answers each of those times leaves the views unchanged and drops ~90% of the rows.
//
// It relies on the sheet's invariant that ingest rows for a (person, date, metric) only go up over time (the server
// appends only higher values), so "the row with the largest value at or before T" answers every read at T
// (`metricAsOf`, `watchIsEdit`). A hand edit that breaks it bumps `rev`, and the client then refetches everything
// (sheets-architecture.md §2.1).
import type { PersonId } from '#lib/types.ts';
import { DATE_RE, isRec, type MetricRow, type SnapshotRows } from '#lib/contract/api.ts';
import { parseInstant } from '#lib/time/dates.ts';
import { weekKeyOf } from '#lib/scoring/index.ts';
import { finalMs, provisionalMs } from './state.ts';

const instant = (v: unknown): number | null => {
  try {
    return parseInstant(String(v ?? ''));
  } catch {
    return null;
  }
};

/** `metric_set` times per `person|date|metric` (accepted or not: a superset of what the model reads is harmless). */
function editTimes(rows: SnapshotRows): Map<string, number[]> {
  const out = new Map<string, number[]>();
  for (const [at, person, , type, data] of rows.events) {
    if (type !== 'metric_set') continue;
    const t = instant(at);
    let d: unknown;
    try {
      d = JSON.parse(data);
    } catch {
      continue;
    }
    if (t === null || !isRec(d)) continue;
    const k = `${person}|${String(d.date)}|${String(d.metric)}`;
    (out.get(k) ?? out.set(k, []).get(k)!).push(t - 1, t);
  }
  return out;
}

/**
 * `rows` with the metrics of locked weeks (as of `now`) reduced to the rows the model can still read: per
 * (person, date, metric), the best row at or before the Sunday 19:30 payout, the Wednesday 04:00 lock, each
 * `metric_set` of that day (and just before it), and overall (late syncs, `lastSync`). Rows of open weeks, rows the
 * model would skip anyway, and the other tabs are kept as they are. Order is preserved. Pure; returns `rows` itself
 * when nothing was dropped.
 */
export function compactRows(rows: SnapshotRows, now: number): SnapshotRows {
  const edits = editTimes(rows);
  const groups = new Map<string, { row: MetricRow; at: number; i: number }[]>();
  const keep = new Set<number>();
  const newest: Partial<Record<PersonId, { at: number; i: number }>> = {};
  rows.metrics.forEach((row, i) => {
    const at = instant(row[0]);
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
  for (const [k, list] of groups) {
    const wk = weekKeyOf(String(list[0].row[2]));
    for (const t of [provisionalMs(wk), finalMs(wk), Infinity, ...(edits.get(k) ?? [])]) {
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
