// Cache compaction for `metrics` rows (and the day tallies a later one replaced, see latestTallies; and the meal log's
// replaced ops, see latestFood). The metrics' rule is the contract's (contract/compact.ts compactKeep), shared with
// the record, which compacts its own rows by it (relay/src/store.ts compact): a locked week's day keeps only the rows
// the model can still read. Keeping them leaves the views unchanged and drops ~90% of the rows.
import type { EventRow, SnapshotRows } from '#lib/contract/api.ts';
import { compactKeep } from '#lib/contract/compact.ts';
import { rowAt } from './snapshot.ts';
import { foldedAway } from './food.ts';

/**
 * `rows` with the metrics of locked weeks (as of `now`) reduced to the rows the model can still read (contract/compact.ts
 * compactKeep), the day tallies a later one replaced and the meal log's folded-away ops out. Rows of open weeks, rows
 * the model would skip anyway, and the other tabs are kept as they are. Order is preserved. Pure; returns `rows` itself
 * when nothing was dropped.
 */
export function compactRows(rows: SnapshotRows, now: number): SnapshotRows {
  const keep = compactKeep(rows.metrics, now, (r) => rowAt(r));
  const events = latestFood(latestTallies(rows.events));
  if (!keep && events === rows.events) return rows;
  return { ...rows, metrics: keep ? rows.metrics.filter((_, i) => keep.has(i)) : rows.metrics, events };
}

/** `events` without the meal log's ops its fold no longer reads (model/food.ts foldedAway): `events` itself when none. */
function latestFood(events: EventRow[]): EventRow[] {
  const drop = foldedAway(events);
  return drop.size ? events.filter((r) => !drop.has(r)) : events;
}

/**
 * `events` without the day rows (tallies, island days) a later one of the same type, person and day replaced (the
 * server deletes those, a cached phone keeps them: the model reads only the latest). Returns `events` itself when none
 * was replaced.
 */
function latestTallies(events: EventRow[]): EventRow[] {
  const latest = new Map<string, { at: number; i: number }>();
  const tallies: number[] = [];
  events.forEach((row, i) => {
    if (row[3] !== 'tally' && row[3] !== 'island') return;
    const at = rowAt(row);
    let date: unknown;
    try { date = (JSON.parse(String(row[4])) as { date?: unknown }).date; } catch { return; }
    if (at === null || typeof date !== 'string') return;
    tallies.push(i);
    const k = `${row[3]}|${row[1]}|${date}`;
    const prev = latest.get(k);
    if (!prev || at >= prev.at) latest.set(k, { at, i });
  });
  if (latest.size === tallies.length) return events;
  const keep = new Set([...latest.values()].map((x) => x.i));
  const drop = new Set(tallies.filter((i) => !keep.has(i)));
  return events.filter((_, i) => !drop.has(i));
}
