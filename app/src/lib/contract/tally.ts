// A `tally` (docs/backend.md#events): one person's counts of what they caught and found on one Tokyo day, for the
// ずかん's 「×12」. The phone keeps the day's tally and sends all of it again when it grows (debounced); the server keeps
// one row per person and day (a new one replaces the day's older row) and the model sums the latest row of each day
// (model/tally.ts). The first find of an entry (who and when) stays the `find` event's. Shared by the Apps Script and
// the model; pure.
import { isLocalDate, isRec } from './api.ts';
import type { LocalDate } from '../types.ts';

/** What a tally counts: the ずかん's kinds (the `find` kinds) and a balloon's presents. */
const TALLY_KINDS = ['fish', 'bug', 'sea', 'fossil', 'shell', 'fragment', 'item', 'recipe'] as const;

/** `kind:id` (model/finds.ts findKey) → how many that day. */
export type Tally = Record<string, number>;
export interface TallyData { date: LocalDate; counts: Tally }

/** Caps: distinct entries in a day (a busy day is a few dozen) and one entry's count; together they keep a row
 *  under the event data limit (300 × ~40 chars ≈ 12 KB < 20 KB). */
export const TALLY_MAX_KEYS = 300;
export const TALLY_MAX_N = 999;

/** A catalog id, the `find` id format (contract/api.ts FIND_ID_RE): lowercase letters, digits and dashes, from a letter. */
const ID_RE = /^[a-z][a-z0-9-]{0,47}$/;
const KIND_RE = new RegExp(`^(?:${TALLY_KINDS.join('|')}):`);

/** A tally key: a known kind and a well-formed id. */
export const isTallyKey = (k: string): boolean => KIND_RE.test(k) && ID_RE.test(k.slice(k.indexOf(':') + 1));

/** A whole count in 1…TALLY_MAX_N. */
const isCount = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= TALLY_MAX_N;

/** The day after `date` (both YYYY-MM-DD). */
const nextDay = (date: LocalDate): LocalDate => new Date(Date.parse(`${date}T00:00:00Z`) + 86400_000).toISOString().slice(0, 10);

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
