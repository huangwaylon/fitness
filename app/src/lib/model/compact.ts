// Cache compaction for `metrics` rows (and the day tallies a later one replaced and the island days before yesterday,
// see latestTallies; and the meal log's replaced ops, see latestFood). The metrics' rule is the contract's (contract/compact.ts compactKeep), shared with
// the record, which compacts its own rows by it (relay/src/store.ts compact): a locked week's day keeps only the rows
// the model can still read. Keeping them leaves the views unchanged and drops ~90% of the rows.
import type { EventRow, SnapshotRows } from '#lib/contract/api.ts';
import { compactKeep } from '#lib/contract/compact.ts';
import { rowAt } from './snapshot.ts';
import { foldedAway } from './food.ts';
import { addDays, localDateAt, prevDay } from '#lib/contract/tokyo.ts';

/**
 * `rows` with the metrics of locked weeks (as of `now`) reduced to the rows the model can still read (contract/compact.ts
 * compactKeep), the day tallies a later one replaced, the island days before yesterday and the meal log's folded-away
 * ops out. Rows of open weeks, rows
 * the model would skip anyway, and the other tabs are kept as they are. Order is preserved. Pure; returns `rows` itself
 * when nothing was dropped.
 */
export function compactRows(rows: SnapshotRows, now: number, ledgers = false, field = false): SnapshotRows {
  const keep = compactKeep(rows.metrics, now, (r) => rowAt(r));
  const events = latestFood(latestTallies(ledgers ? ledgerHistory(rows.events, now, field) : rows.events, now));
  if (!keep && events === rows.events) return rows;
  return { ...rows, metrics: keep ? rows.metrics.filter((_, i) => keep.has(i)) : rows.metrics, events };
}

/** With the relay's stored ledger (docs/backend.md#the-ledger, `ledgers`: the cache's): `events` without the shop's rows
 *  older than 2 days (and, with the stored field, the farm rows) and the day tallies and give-backs older than 36 days (the record lets them go: relay/src/store.ts
 *  ledgerPrune; the model reads only the unsent ones and the days a phone may still send). `events` itself when none. */
function ledgerHistory(events: EventRow[], now: number, field: boolean): EventRow[] {
  const cut = now - 2 * 86_400_000, oldest = addDays(localDateAt(now), -36);
  const out = events.filter((r) => {
    if (SHOP_ROWS.includes(r[3]) || (field && r[3] === 'farm')) return (rowAt(r) ?? now) >= cut;
    if (r[3] !== 'tally' && r[3] !== 'tally_back') return true;
    try {
      const d = (JSON.parse(String(r[4])) as { date?: unknown }).date;
      return typeof d !== 'string' || d >= oldest;
    } catch { return true; }
  });
  return out.length === events.length ? events : out;
}
const SHOP_ROWS: readonly string[] = ['sell', 'buy', 'buy_starts', 'sg_reward', 'shop_adjust'];

/** `events` without the meal log's ops its fold no longer reads (model/food.ts foldedAway): `events` itself when none. */
function latestFood(events: EventRow[]): EventRow[] {
  const drop = foldedAway(events);
  return drop.size ? events.filter((r) => !drop.has(r)) : events;
}

/**
 * `events` without the day rows (tallies, island days) a later one of the same type, person and day replaced and the
 * plots' farm_water rows a later one of the plot's replaced (the server deletes those, a cached phone keeps them: the
 * model reads only the latest), and the island days before yesterday (as of `now`: the server deletes them,
 * relay/src/store.ts islandPrune; nothing reads them). Returns `events` itself when none went.
 */
function latestTallies(events: EventRow[], now: number): EventRow[] {
  const latest = new Map<string, { at: number; i: number }>();
  const tallies: number[] = [];
  const old = prevDay(localDateAt(now));
  const gone = new Set<number>();
  events.forEach((row, i) => {
    if (row[3] !== 'tally' && row[3] !== 'tally_back' && row[3] !== 'island' && row[3] !== 'farm_water') return;
    const at = rowAt(row);
    let key: unknown;
    try {
      const d = JSON.parse(String(row[4])) as { date?: unknown; p?: unknown };
      key = row[3] === 'farm_water' ? d.p : d.date;
    } catch { return; }
    if (at === null || typeof key !== 'string') return;
    if (row[3] === 'island' && key < old) {
      gone.add(i);
      return;
    }
    tallies.push(i);
    const k = `${row[3]}|${row[1]}|${key}`;
    const prev = latest.get(k);
    if (!prev || at >= prev.at) latest.set(k, { at, i });
  });
  if (latest.size === tallies.length && !gone.size) return events;
  const keep = new Set([...latest.values()].map((x) => x.i));
  const drop = new Set([...gone, ...tallies.filter((i) => !keep.has(i))]);
  return events.filter((_, i) => !drop.has(i));
}
