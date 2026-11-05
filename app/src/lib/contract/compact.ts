// The `metrics` compaction rule (docs/backend.md#compaction), shared by the phones' cache (model/compact.ts) and the
// record (relay/src/store.ts compact), so both drop exactly the rows the model can no longer read. Pure, over the
// contract only (the relay imports it from here).
//
// With frequent (≈ hourly) Shortcut runs a day collects ~20 rows per person and metric, but once its week has locked
// (Wednesday 04:00 JST after it) the model only ever reads that day's value at a few fixed times. A day's value as of T
// is its latest row stamped at or before T. A locked week's earnings read it as of the lock, so per (person, date,
// metric) the latest row at or before the lock is kept, and the latest overall (the day's current value). Weight and
// the body metrics are read only as of now: only their newest row per (person, date, metric). Per person the newest row
// stays too (the model's `lastSync`).
import { DATE_RE, isActivityMetric, type MetricRow } from './api.ts';
import type { PersonId } from '../types.ts';

const DAY_MS = 86_400_000;
/** Wednesday 04:00 JST, as days and ms after the week's Monday 00:00 UTC (model/state.ts finalMs: CUTOFFS.final). */
const LOCK_AFTER_MONDAY_MS = 9 * DAY_MS + (4 - 9) * 3600_000;

const LOCKS = new Map<string, number>();
/**
 * When the week of `date` (`YYYY-MM-DD`, Monday to Sunday) locks: the Wednesday 04:00 JST after it, ms since the epoch
 * (model/state.ts finalMs(weekKeyOf(date)), checked equal in compact.test.ts). NaN for a string that isn't a date.
 */
export function weekLockMs(date: string): number {
  let ms = LOCKS.get(date);
  if (ms === undefined) {
    if (!DATE_RE.test(date)) return NaN;
    const [y, m, d] = date.split('-').map(Number);
    const day = Date.UTC(y, m - 1, d);
    const sinceMonday = (new Date(day).getUTCDay() + 6) % 7;
    ms = day - sinceMonday * DAY_MS + LOCK_AFTER_MONDAY_MS;
    if (LOCKS.size > 4096) LOCKS.clear();
    LOCKS.set(date, ms);
  }
  return ms;
}

/** A row's `at` in ms, or null when it isn't an instant. */
const parseAt = (r: readonly unknown[]): number | null => {
  const ms = typeof r[0] === 'string' ? Date.parse(r[0]) : NaN;
  return Number.isNaN(ms) ? null : ms;
};

/**
 * The indexes of `rows` that compaction keeps as of `now` (null: every row, nothing to drop): rows of open weeks and
 * rows the model would skip anyway (no `at`, no date, no finite value) as they are; of a locked week's, per (person,
 * date, metric) the latest row at or before its lock (activity metrics only) and the latest overall (a tie: the later
 * in the list, as the model's stable sort reads it), and per person the newest row. A fixed point: compacting the kept
 * rows keeps them all. `atOf` reads a row's `at` (the model passes its memoised parse).
 */
export function compactKeep(rows: readonly MetricRow[], now: number, atOf: (r: MetricRow) => number | null = parseAt): Set<number> | null {
  const groups = new Map<string, { at: number; i: number }[]>();
  const metricOf = new Map<string, MetricRow[3]>();
  const keep = new Set<number>();
  const newest: Partial<Record<PersonId, { at: number; i: number }>> = {};
  rows.forEach((row, i) => {
    const at = atOf(row);
    const date = String(row[2]);
    if (at === null || !DATE_RE.test(date) || !Number.isFinite(Number(row[4])) || now < weekLockMs(date)) {
      keep.add(i);
      return;
    }
    const p = row[1];
    if (!newest[p] || at >= newest[p]!.at) newest[p] = { at, i };
    const k = `${p}|${date}|${row[3]}`;
    let list = groups.get(k);
    if (!list) {
      groups.set(k, (list = []));
      metricOf.set(k, row[3]);
    }
    list.push({ at, i });
  });
  for (const n of Object.values(newest)) if (n) keep.add(n.i);
  /** The latest row stamped at or before t (a tie: the later one in the list). */
  const latestBy = (list: { at: number; i: number }[], t: number) => {
    let last: { at: number; i: number } | null = null;
    for (const x of list) if (x.at <= t && (!last || x.at >= last.at)) last = x;
    if (last) keep.add(last.i);
  };
  for (const [k, list] of groups) {
    latestBy(list, Infinity);
    if (isActivityMetric(metricOf.get(k))) latestBy(list, weekLockMs(k.split('|')[1]));
  }
  return keep.size === rows.length ? null : keep;
}
