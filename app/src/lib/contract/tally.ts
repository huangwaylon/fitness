// A `tally` (docs/backend.md#events): one person's counts of what they caught and found on one Tokyo day, for the
// ずかん's 「×12」. The phone keeps the day's tally and sends all of it again when it grows (held a minute, store/actions.ts); the server keeps
// one row per person and day (a new one replaces the day's older row) and the model sums the latest row of each day
// (model/tally.ts). The first find of an entry (who and when) stays the `find` event's. Shared by the record
// (relay/src/store.ts) and the model; pure.
import { isFind, isFindId, isLocalDate, isRec, nextDay } from './api.ts';
import type { LocalDate } from '../types.ts';

/** `kind:id` (model/finds.ts findKey) → how many that day. */
export type Tally = Record<string, number>;
export interface TallyData { date: LocalDate; counts: Tally }

/** Caps: distinct entries in a day (a busy day is a few dozen) and one entry's count; together they keep a row
 *  under the event data limit (300 × ~40 chars ≈ 12 KB < 20 KB). */
export const TALLY_MAX_KEYS = 300;
export const TALLY_MAX_N = 999;

/** A tally key: `kind:id` of a well-formed find (contract/api.ts isFind: the ずかん's kinds and a present's), or of the
 *  pocket's goods (`goods:wood`: picked up, never a find; contract/pocket.ts). */
export function isTallyKey(k: string): boolean {
  const i = k.indexOf(':');
  if (i <= 0) return false;
  const kind = k.slice(0, i), id = k.slice(i + 1);
  return kind === 'goods' ? isFindId(id) : isFind({ kind, id });
}

/** A whole count in 1…TALLY_MAX_N. */
const isCount = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= TALLY_MAX_N;

/**
 * A `tally`'s data: `{date, counts}` and nothing else, a real date (not after tomorrow when `today`, the server's Tokyo
 * date, is given: a phone's clock may run a little ahead), and 1…TALLY_MAX_KEYS well-formed keys with whole counts.
 */
export function isTally(d: Record<string, unknown>, today?: LocalDate): d is Record<string, unknown> & TallyData {
  if (Object.keys(d).length !== 2 || !isLocalDate(d.date) || !isRec(d.counts)) return false;
  if (today && d.date > nextDay(today)) return false;
  const keys = Object.keys(d.counts);
  if (keys.length === 0 || keys.length > TALLY_MAX_KEYS) return false;
  for (const k of keys) if (!isTallyKey(k) || !isCount(d.counts[k])) return false;
  return true;
}

/**
 * A `tally_back` (2026-11-05): what one person gives back of one day's tally, `{date, counts}` as a tally's: a claim
 * race lost after the day's tally already reached the record (the partner's claim was first; tallies only go up, so
 * the catch is taken back by a row of its own). Its slot is the person's day, its counts only grow (mergeTally), and
 * the record keeps it only while that day's tally covers it (backCovered): a person's day counts are the tally's less
 * these. The ずかん and the pocket read the difference (model/tally.ts). @public (relay/src/store.ts)
 */
export function backCovered(tally: Tally, back: Tally): boolean {
  for (const k in back) if (back[k] > (tally[k] ?? 0)) return false;
  return true;
}

/**
 * Two tallies of one person's day as one: each entry's larger count (a day's counts only grow, so a lower one is a
 * stale send: a second phone's, a queue that waited). `held`'s entries first, then `next`'s new ones while there is room
 * (TALLY_MAX_KEYS: the row stays valid). The record keeps this over the slot's row (relay/src/store.ts) and the model
 * folds a day's rows by it (model/tally.ts), so a count never goes down and a sale it covered is never uncovered.
 */
export function mergeTally(held: Tally, next: Tally): Tally {
  const out: Tally = { ...held };
  let n = Object.keys(out).length;
  for (const k in next) {
    if (Object.hasOwn(out, k)) out[k] = Math.max(out[k], next[k]);
    else if (n < TALLY_MAX_KEYS) {
      out[k] = next[k];
      n++;
    }
  }
  return out;
}
