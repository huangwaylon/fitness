// Removals expire (the user, 2026-11-24; docs/backend.md#events "Latest op only"): a removal's row (`rm: true`, its
// slot's last) is kept TOMB_KEEP_DAYS by its stored `at`, then the record deletes it (relay/src/store.ts tombPrune, the
// 03:00 cron) and the phones' caches drop it with the rows of its slot (model/compact.ts). Without the row a late op
// could set the item again, so an op on an empty slot whose item is older than LATE_MS is acknowledged and dropped
// (`lateOp`): an op older than a removal is older than it (a sender's `at` is at most AHEAD_MS past the record's); and
// where an item's id says when it was made (ID_TIMED: newOpId at its making), even a fresh edit of a removed item, from
// a cache that never saw the removal, finds its slot empty and its item too old. (A meal's repeat may take an id of an
// older time, repeatAutoId, and a wedding task an imported one: theirs is the op's `at` alone.) A phone whose `since`
// predates a pruned removal refetches everything (the snapshot's `rev`, relay/src/store.ts), as its cache may still
// hold the item.
// Kept for good: an outdoor object's removal (it may hide a default piece) and a packing list's seed item's (it hides
// the trip's seed). Shared by the record and the phones; pure.
import { AHEAD_MS } from './ops.ts';
import { isRoomScope } from './layout.ts';
import { isNewId } from './pack.ts';

type Rec = Record<string, unknown>;

/** A removal's row is kept this many days after its stored `at`. */
const TOMB_KEEP_DAYS = 60;
const DAY_MS = 86_400_000;
/** An op on an empty slot whose item is older than this is too late (TOMB_KEEP_DAYS less AHEAD_MS). */
const LATE_MS = TOMB_KEEP_DAYS * DAY_MS - AHEAD_MS;
/** The types whose removals expire. Never the shared money's (`fin_*`, contract/finance.ts): its delete is the
 *  payload's `del`, reversible and kept for good, so it is neither pruned nor ever a late op (tomb.test.ts). */
const TYPES: readonly string[] = ['decor', 'board', 'food', 'food_repeat', 'food_recipe', 'food_custom', 'pack', 'wtask', 'todo', 'hike', 'room_save'];
/** The types whose ids carry the time they were made at. */
const ID_TIMED: readonly string[] = ['decor', 'board', 'pack', 'todo', 'hike'];
/** No id of ours is older (2023-11-14). */
const ID_MIN_MS = 1.7e12;

/** Whether an op is of a kind whose removal expires: the island's decorations, a room's pieces (not the outdoors'), a
 *  packing list's own items (not the seed's) and every other type of TYPES. */
export function expiresKind(type: string, d: Rec): boolean {
  if (!TYPES.includes(type)) return false;
  if (type === 'decor') return d.sc === undefined || isRoomScope(d.sc);
  return type !== 'pack' || isNewId(d.id);
}

/** Whether a stored row is a removal that expires. */
export const isExpiringRemoval = (type: string, d: Rec): boolean => d.rm === true && expiresKind(type, d);

/** Removals stored before this (ms) are let go. */
export const tombCut = (now: number): number => now - TOMB_KEEP_DAYS * DAY_MS;

/** When an op's item was made, as far as it tells: the earlier of its `at` and its id's time (a letter, then the ms
 *  in eight base-36 digits: newOpId and the tent's ids) for ID_TIMED, the id's only when plausible. */
function bornMs(type: string, d: Rec, now: number): number {
  const at = typeof d.at === 'number' ? d.at : now;
  const m = ID_TIMED.includes(type) && typeof d.id === 'string' ? /^[a-z_]([0-9a-z]{8})/.exec(d.id) : null;
  const t = m ? parseInt(m[1], 36) : NaN;
  return t >= ID_MIN_MS && t <= now + AHEAD_MS ? Math.min(at, t) : at;
}

/** Whether an op on an empty slot comes too late: its item may have been removed and the removal let go. */
export const lateOp = (type: string, d: Rec, now: number): boolean => expiresKind(type, d) && bornMs(type, d, now) < now - LATE_MS;
