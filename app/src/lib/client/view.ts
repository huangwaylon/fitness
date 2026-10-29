// Cached snapshot + still-queued events → WeekView (optimistic: a tap shows at once, before the server acks it).
import type { WeekView } from '#lib/types.ts';
import type { EventRow } from '#lib/ingest/sheet-api.ts';
import { buildWeekView } from '#lib/model/week.ts';
import type { QueuedEvent, SnapshotCache } from './gas.ts';

/**
 * Queued events become rows stamped just after the newest server row (in queue order) on the server's clock, so
 * read-time rules (48 h check-in window, purse balance, harvest week) judge them as the server will.
 */
export function composeView(cache: SnapshotCache, queue: QueuedEvent[], clientNow: number): WeekView {
  const known = new Set(cache.rows.events.map((r) => String(r[2])));
  const lastAt = cache.since ? Date.parse(cache.since) : 0;
  let floor = Number.isNaN(lastAt) ? 0 : lastAt;
  const extra: EventRow[] = [];
  for (const ev of queue) {
    if (known.has(ev.id)) continue; // acked but the ack was lost: the server row wins
    const at = Math.max(ev.queuedAt + cache.skewMs, floor + 1);
    floor = at;
    extra.push([new Date(at).toISOString(), cache.me, ev.id, ev.type, JSON.stringify(ev.data)]);
  }
  const now = Math.max(clientNow + cache.skewMs, floor);
  const rows = extra.length ? { ...cache.rows, events: [...cache.rows.events, ...extra] } : cache.rows;
  return buildWeekView({ me: cache.me, now: new Date(now).toISOString(), rows }, cache.me, now);
}

/** The events from `list` whose rows the cache doesn't have yet (acked events drop out once fetched back). */
export function notInCache<E extends { id: string }>(cache: SnapshotCache, list: E[]): E[] {
  if (!list.length) return list;
  const known = new Set(cache.rows.events.map((r) => String(r[2])));
  return list.filter((e) => !known.has(e.id));
}
