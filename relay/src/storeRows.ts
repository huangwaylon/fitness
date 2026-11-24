// The record's rows read in `at` order (store.ts): a snapshot's rows since a time, whole or a page at a time, with the
// late rows a poll also gets; the cursor of a page.
import { CURSOR_RE, SNAPSHOT_PAGE_MAX, type EventRow, type MetricRow, type PersonId, type SnapshotRows, type Who } from '../../app/src/lib/contract/api.ts';
import type { Bind, Sql } from './storeSchema.ts';

/** A late row is returned to a poll whose `since` is at most this much after its arrival (the servers' clocks). */
export const LATE_MARGIN_MS = 10_000;
const SEQ_MAX = 9e15;

/** A page's place (contract/api.ts CURSOR_RE): the last row's `at`, its table and its seq. */
export interface Cursor { at: string; t: 'm' | 'e'; seq: number }
/** A cursor from the wire, or undefined when it isn't one. */
export function cursorOf(x: unknown): Cursor | undefined {
  const m = typeof x === 'string' ? CURSOR_RE.exec(x) : null;
  return m ? { at: m[1], t: m[2] as 'm' | 'e', seq: Number(m[3]) } : undefined;
}
export const isPageSize = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= SNAPSHOT_PAGE_MAX;

export type MetricCols = { at: string; person: PersonId; date: string; metric: MetricRow[3]; value: number };
export type EventCols = { at: string; person: Who; id: string; type: EventRow[3]; data: string };

export const METRIC_COLS = 'at, person, date, metric, value';
export const EVENT_COLS = 'at, person, id, type, data';
export const metricRow = (r: MetricCols): MetricRow => [r.at, r.person, r.date, r.metric, r.value];
export const eventRow = (r: EventCols): EventRow => [r.at, r.person, r.id, r.type, r.data];
/** `at`, then `seq`. */
const byAt = (x: { at: string; seq: number }, y: { at: string; seq: number }): number => (x.at < y.at ? -1 : x.at > y.at ? 1 : x.seq - y.seq);

/** Every row after `since` ('' = all), in `at` order: the `at` index, and the late rows that came in after it. */
export function rowsSince(sql: Sql, since: string): SnapshotRows {
  const pick = <T extends Record<string, Bind>>(tab: 'metrics' | 'events', cols: string): (T & { seq: number; at: string })[] => {
    const rows = sql.exec<T & { seq: number; at: string }>(`SELECT seq, ${cols} FROM ${tab} WHERE at > ? ORDER BY at, seq`, since).toArray();
    if (!since) return rows;
    const extra = lateRows<T>(sql, tab, cols, since);
    return extra.length ? [...rows, ...extra].sort(byAt) : rows;
  };
  return { metrics: pick<MetricCols>('metrics', METRIC_COLS).map(metricRow), events: pick<EventCols>('events', EVENT_COLS).map(eventRow) };
}

/** The late rows a poll at `since` also gets: stamped at or before it, arrived after it less LATE_MARGIN_MS. */
function lateRows<T extends Record<string, Bind>>(sql: Sql, tab: 'metrics' | 'events', cols: string, since: string): (T & { seq: number; at: string })[] {
  return sql.exec<T & { seq: number; at: string }>(`SELECT seq, ${cols} FROM ${tab} WHERE late > ? AND at <= ?`, Date.parse(since) - LATE_MARGIN_MS, since).toArray();
}

/**
 * A page of the rows after `since`: the next `limit` in (at, table, seq) order after `after` (null: the first page,
 * which also brings the late rows), with the cursor of its last row when there are more (`next`). The pages together
 * are rowsSince(since); a row written between two pages comes in a later one (its `at` is after every row handed
 * out before), so a phone that applies the pages together has the record as of the last one. Reads ≤ 2 (limit + 1)
 * rows from the `at` indexes.
 */
export function rowsPage(sql: Sql, since: string, after: Cursor | null, limit: number): { rows: SnapshotRows; next: string | null } {
  const c: Cursor = after ?? { at: since, t: 'e', seq: SEQ_MAX };
  // the rows of one `at` go metrics first, then events: past an event's row none of that `at`'s metrics are left
  const floor = (t: 'm' | 'e') => (c.t === t ? c.seq : t === 'm' ? SEQ_MAX : -1);
  const take = <T extends Record<string, Bind>>(tab: 'metrics' | 'events', t: 'm' | 'e', cols: string) =>
    sql.exec<T & { seq: number; at: string }>(`SELECT seq, ${cols} FROM ${tab} WHERE at >= ? AND (at > ? OR seq > ?) ORDER BY at, seq LIMIT ?`, c.at, c.at, floor(t), limit + 1)
      .toArray();
  const ms = take<MetricCols>('metrics', 'm', METRIC_COLS), es = take<EventCols>('events', 'e', EVENT_COLS);
  // merged in (at, table, seq) order: the first `limit`
  let i = 0, j = 0, n = 0;
  let last: string | null = null;
  while (n < limit && (i < ms.length || j < es.length)) {
    const m = ms[i], e = es[j];
    const r = m && (!e || m.at <= e.at) ? { x: ms[i++], t: 'm' } : { x: es[j++], t: 'e' };
    last = `${r.x.at}|${r.t}|${r.x.seq}`;
    n++;
  }
  const metrics = ms.slice(0, i), events = es.slice(0, j);
  const more = i < ms.length || j < es.length;
  if (!after && since) {
    const lm = lateRows<MetricCols>(sql, 'metrics', METRIC_COLS, since), le = lateRows<EventCols>(sql, 'events', EVENT_COLS, since);
    if (lm.length) metrics.push(...lm), metrics.sort(byAt);
    if (le.length) events.push(...le), events.sort(byAt);
  }
  return { rows: { metrics: metrics.map(metricRow), events: events.map(eventRow) }, next: more ? last : null };
}
