// Cached snapshot + still-queued events → the reduced state (optimistic: a tap shows at once, before the server acks it).
import type { EventRow } from '#lib/contract/api.ts';
import type { Who } from '#lib/types.ts';
import { foldEvents, lastLockAt, reduce, type State } from '#lib/model/state.ts';
import type { QueuedEvent } from '#lib/sync/queue.ts';
import type { SnapshotCache } from '#lib/sync/cache.ts';

/** The reduced state (cache + queue) and the server-clock "now": what the island and きろく (model/history.ts) read. */
export interface ComposedModel {
  state: State;
  /** Who this phone is (`G`: the guest). */
  me: Who;
  now: number;
  /** What `state` was reduced from: an unchanged input reuses it (the minute tick only moves `now`). */
  readonly from?: { rows: SnapshotCache['rows']; demo: SnapshotCache['demo']; extra: string; rev: string | null };
}

/**
 * Queued events become rows stamped just after the newest server row (in queue order) on the server's clock, so
 * read-time rules (the wallet balance, the harvest week) judge them as the server will.
 * `prev`: the last result; its state is reused when the rows and the queued rows are the same (reduce is the
 * expensive part). Live rows pass their `rev` so locked weeks' earnings are reused across
 * States, unless a queued row is stamped before the latest lock (an old offline tap): the server will stamp it
 * later, so it must not pin a locked week.
 */
export function composeModel(cache: SnapshotCache, queue: QueuedEvent[], clientNow: number, prev?: ComposedModel | null): ComposedModel {
  const known = eventIds(cache.rows);
  const seen = new Set<string>();
  const lastAt = cache.since ? Date.parse(cache.since) : 0;
  let floor = Number.isNaN(lastAt) ? 0 : lastAt;
  const extra: EventRow[] = [];
  for (const ev of queue) {
    if (known.has(ev.id) || seen.has(ev.id)) continue; // acked but the ack was lost: the server row wins
    seen.add(ev.id); // the same event twice (sent + still queued, overlapping flushes) is one row
    const at = Math.max(ev.queuedAt + cache.skewMs, floor + 1);
    floor = at;
    // Only the demo's shared event list names another sender; live events are always mine.
    extra.push([new Date(at).toISOString(), (cache.demo && ev.person) || cache.me, ev.id, ev.type, JSON.stringify(ev.data)]);
  }
  const now = Math.max(clientNow + cache.skewMs, floor);
  const baseRev = cache.demo || !cache.rev ? null : `${cache.rev}@${cache.rowsAt}`;
  const rev = baseRev === null || (extra.length && Date.parse(extra[0][0]) <= lastLockAt(now)) ? null : baseRev;
  const from = { rows: cache.rows, demo: cache.demo, extra: JSON.stringify(extra), rev };
  const p = prev?.from;
  if (prev && p && p.rows === from.rows && p.demo === from.demo && p.extra === from.extra && p.rev === from.rev && prev.me === cache.me) {
    return { state: prev.state, me: cache.me, now, from };
  }
  // The cached rows' state is reduced once per row set; the queued rows are folded over a copy of it (a tap
  // re-reduces nothing).
  const base = reduceRows(cache.rows, baseRev);
  const state = extra.length ? (foldEvents(base, extra, rev) ?? reduce({ ...cache.rows, events: [...cache.rows.events, ...extra] }, rev)) : base;
  return { state, me: cache.me, now, from };
}

/** The last row set reduced, and its State (never mutated: bells.ts caches per State). */
let reduced: { rows: SnapshotCache['rows']; rev: string | null; state: State } | null = null;
function reduceRows(rows: SnapshotCache['rows'], rev: string | null): State {
  if (reduced?.rows !== rows || reduced.rev !== rev) reduced = { rows, rev, state: reduce(rows, rev) };
  return reduced.state;
}

/** The event ids of a row set, kept with it (a WeakMap: a row set no longer cached takes its Set with it). */
const idsOf = new WeakMap<SnapshotCache['rows']['events'], Set<string>>();
function eventIds(rows: SnapshotCache['rows']): ReadonlySet<string> {
  let ids = idsOf.get(rows.events);
  if (!ids) idsOf.set(rows.events, (ids = new Set(rows.events.map((r) => String(r[2])))));
  return ids;
}

/**
 * A fetch that completed this long after an ack would have brought the event's row back (a request times out after
 * 20 s, twice for a resync): an acked event still missing then was removed from the sheet by hand, so stop showing it.
 */
export const ACKED_MAX_UNSEEN_MS = 5 * 60_000;

/** The acked events still to show: not in the cache yet, and not given up on (see ACKED_MAX_UNSEEN_MS). */
export function pendingAcked<E extends { id: string; ackedAt?: number }>(cache: SnapshotCache, list: E[]): E[] {
  return notInCache(cache, list).filter((e) => e.ackedAt === undefined || cache.fetchedAt < e.ackedAt + ACKED_MAX_UNSEEN_MS);
}

/** The events from `list` whose rows the cache doesn't have yet (acked events drop out once fetched back). */
export function notInCache<E extends { id: string }>(cache: SnapshotCache, list: E[]): E[] {
  if (!list.length) return list;
  const known = eventIds(cache.rows);
  return list.filter((e) => !known.has(e.id));
}
