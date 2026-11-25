// Cache compaction for `metrics` rows (and the day tallies a later one replaced and the island days before yesterday,
// see latestTallies; and the meal log's replaced ops, see latestFood). The metrics' rule is compactKeep.ts's: a locked
// week's day keeps only the rows the model can still read. Keeping them leaves the views unchanged and drops ~90% of the rows.
import type { EventRow, SnapshotRows } from '#lib/contract/api.ts';
import { compactKeep } from './compactKeep.ts';
import { rowAt } from './snapshot.ts';
import { foldedAway } from './food.ts';
import { addDays, localDateAt, prevDay } from '#lib/contract/tokyo.ts';
import { eventSlot } from '#lib/contract/record.ts';
import { isExpiringRemoval, tombCut } from '#lib/contract/tomb.ts';

/**
 * `rows` with the metrics of locked weeks (as of `now`) reduced to the rows the model can still read (compactKeep.ts),
 * the day tallies a later one replaced, the island days before yesterday, the meal log's folded-away ops and the removals
 * let go (expiredRemovals) out. Rows of open weeks, rows
 * the model would skip anyway, and the other tabs are kept as they are. Order is preserved. Pure; returns `rows` itself
 * when nothing was dropped.
 */
export function compactRows(rows: SnapshotRows, now: number, ledgers = false, field = false): SnapshotRows {
  const keep = compactKeep(rows.metrics, now, (r) => rowAt(r));
  const events = latestFood(latestTallies(expiredRemovals(ledgers ? ledgerHistory(rows.events, now, field) : rows.events, now), now));
  if (!keep && events === rows.events) return rows;
  return { ...rows, metrics: keep ? rows.metrics.filter((_, i) => keep.has(i)) : rows.metrics, events };
}

/** With the relay's stored ledger (docs/backend.md#the-ledger, `ledgers`: the cache's): `events` without the shop's rows
 *  (and with the stored field, the farm's) older than 2 days and the day tallies and give-backs older than 36 days (the record lets them go: relay/src/store.ts
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

/** `events` without the removals stored more than 60 days ago and the rows of their slots before them (the record lets
 *  them go: contract/tomb.ts, relay/src/store.ts tombPrune), so the item is gone as it is from the record, never shown
 *  again by a row the removal had beaten. `events` itself when none. */
function expiredRemovals(events: EventRow[], now: number): EventRow[] {
  const cut = tombCut(now);
  const gone = new Map<string, number>(), types = new Set<string>();
  const slotOf = (r: EventRow, d: Record<string, unknown>) => eventSlot(r[3], r[1], r[1], d, rowAt(r) ?? now);
  for (const r of events) {
    const at = rowAt(r);
    if (at === null || at >= cut || !r[4].includes('"rm"')) continue;
    const d = parse(r[4]);
    const slot = d && isExpiringRemoval(r[3], d) ? slotOf(r, d) : null;
    if (slot) {
      gone.set(slot, Math.max(gone.get(slot) ?? 0, at));
      types.add(r[3]);
    }
  }
  if (!gone.size) return events;
  return events.filter((r) => {
    const at = rowAt(r);
    if (at === null || at > cut || !types.has(r[3])) return true;
    const d = parse(r[4]);
    const slot = d ? slotOf(r, d) : null;
    return !slot || !gone.has(slot) || at > gone.get(slot)!;
  });
}

const parse = (raw: string): Record<string, unknown> | null => {
  try {
    const x = JSON.parse(raw) as unknown;
    return x !== null && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : null;
  } catch { return null; }
};

/** `events` without the meal log's ops its fold no longer reads (model/food.ts foldedAway): `events` itself when none. */
function latestFood(events: EventRow[]): EventRow[] {
  const drop = foldedAway(events);
  return drop.size ? events.filter((r) => !drop.has(r)) : events;
}

/**
 * `events` without the day rows (tallies, island days) a later one of the same type, person and day replaced (the
 * server deletes those, a cached phone keeps them: the model reads only the latest), the island days before yesterday
 * (as of `now`: the server deletes them, relay/src/store.ts islandPrune; nothing reads them) and an older record's
 * `farm_water` rows (nothing reads them). Returns `events` itself when none went.
 */
function latestTallies(events: EventRow[], now: number): EventRow[] {
  const latest = new Map<string, { at: number; i: number }>();
  const tallies: number[] = [];
  const old = prevDay(localDateAt(now));
  const gone = new Set<number>();
  events.forEach((row, i) => {
    if (row[3] === 'farm_water') {
      gone.add(i);
      return;
    }
    if (row[3] !== 'tally' && row[3] !== 'tally_back' && row[3] !== 'island') return;
    const at = rowAt(row);
    let key: unknown;
    try {
      key = (JSON.parse(String(row[4])) as { date?: unknown }).date;
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
