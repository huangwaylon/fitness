// Cached snapshot + still-queued events → the reduced state (optimistic: a tap shows at once, before the server acks it).
import type { EventRow } from '#lib/contract/api.ts';
import type { PersonId } from '#lib/types.ts';
import { finalMs, provisionalMs, reduce, type State } from '#lib/model/state.ts';
import { addDays, nowInZone, weekKeyOf } from '#lib/scoring/index.ts';
import type { QueuedEvent } from '#lib/sync/queue.ts';
import type { SnapshotCache } from '#lib/sync/cache.ts';

/** The reduced state (cache + queue) and the server-clock "now": what the island and きろく (model/history.ts) read. */
export interface ComposedModel {
  state: State;
  me: PersonId;
  now: number;
  /** What `state` was reduced from: an unchanged input reuses it (the minute tick only moves `now`). */
  readonly from?: { rows: SnapshotCache['rows']; demo: SnapshotCache['demo']; extra: string; rev: string | null };
}

/**
 * An unsent edit that can no longer land before its week's lock (server clock): it would be refused, so it is not
 * shown as applied and the queue drops it with a message (round 7 M1). It goes out no earlier than `nextAt`.
 */
export const missesLock = (ev: Pick<QueuedEvent, 'lockAt' | 'nextAt'>, clientNow: number, skewMs: number): boolean =>
  ev.lockAt !== undefined && Math.max(ev.nextAt, clientNow) + skewMs >= ev.lockAt;

/** The latest payout cutoff (Sunday 19:30 or Wednesday 04:00) at or before `now`. */
function lastCutoff(now: number): number {
  const cur = weekKeyOf(nowInZone(new Date(now)).date);
  const prev = addDays(cur, -7);
  return Math.max(...[provisionalMs(cur), finalMs(prev), provisionalMs(prev)].filter((t) => t <= now));
}

/**
 * Queued events become rows stamped just after the newest server row (in queue order) on the server's clock, so
 * read-time rules (48 h check-in window, purse balance, harvest week) judge them as the server will.
 * `pending`: the still-unsent part of `queue` (only those can miss their lock; acked ones already landed).
 * `prev`: the last result; its state is reused when the rows and the queued rows are the same (reduce is the
 * expensive part: round 9 §2 item 11). Live rows pass their `rev` so payouts of past cutoffs are reused across
 * States, unless a queued row is stamped before the latest cutoff (an old offline tap): the server will stamp it
 * later, so it must not pin a past payout.
 */
export function composeModel(cache: SnapshotCache, queue: QueuedEvent[], clientNow: number, pending?: Set<string>, prev?: ComposedModel | null): ComposedModel {
  const known = new Set(cache.rows.events.map((r) => String(r[2])));
  const lastAt = cache.since ? Date.parse(cache.since) : 0;
  let floor = Number.isNaN(lastAt) ? 0 : lastAt;
  const extra: EventRow[] = [];
  for (const ev of queue) {
    if (known.has(ev.id)) continue; // acked but the ack was lost: the server row wins
    known.add(ev.id); // the same event twice (sent + still queued, overlapping flushes) is one row (review r2 N2)
    if ((!pending || pending.has(ev.id)) && missesLock(ev, clientNow, cache.skewMs)) continue;
    const at = Math.max(ev.queuedAt + cache.skewMs, floor + 1);
    floor = at;
    // Only the demo's shared event list names another sender; live events are always mine (round 7 L2).
    extra.push([new Date(at).toISOString(), (cache.demo && ev.person) || cache.me, ev.id, ev.type, JSON.stringify(ev.data)]);
  }
  const now = Math.max(clientNow + cache.skewMs, floor);
  const rev = cache.demo || !cache.rev || (extra.length && Date.parse(extra[0][0]) <= lastCutoff(now)) ? null : `${cache.rev}@${cache.rowsAt ?? 0}`;
  const from = { rows: cache.rows, demo: cache.demo, extra: JSON.stringify(extra), rev };
  const p = prev?.from;
  if (prev && p && p.rows === from.rows && p.demo === from.demo && p.extra === from.extra && p.rev === from.rev && prev.me === cache.me) {
    return { state: prev.state, me: cache.me, now, from };
  }
  const rows = extra.length ? { ...cache.rows, events: [...cache.rows.events, ...extra] } : cache.rows;
  return { state: reduce(rows, cache.demo ?? null, rev), me: cache.me, now, from };
}

/** The events from `list` whose rows the cache doesn't have yet (acked events drop out once fetched back). */
export function notInCache<E extends { id: string }>(cache: SnapshotCache, list: E[]): E[] {
  if (!list.length) return list;
  const known = new Set(cache.rows.events.map((r) => String(r[2])));
  return list.filter((e) => !known.has(e.id));
}
