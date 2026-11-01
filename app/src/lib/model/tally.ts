// The ずかん's counts (docs/design.md "Zukan"): how many of each fish, bug, sea creature, fossil, shell, star fragment,
// present and recipe we've had, in all and per person, from the `tally` rows (contract/tally.ts). Each row is one
// person's whole tally for one Tokyo day and a later row for the same person and day replaces it, so a total is the
// sum over people and days of each day's latest row. Pure; the economy never imports this (a find is worth no ベル).
//
// Cost: one pass over the rows (two years ≈ 1,460 rows of a few dozen keys each, well under a millisecond), memoised
// per row list like model/finds.ts.
import type { LocalDate, PersonId } from '#lib/types.ts';
import { TALLY_MAX_KEYS, TALLY_MAX_N, type Tally } from '#lib/contract/tally.ts';

export interface TallyRow {
  /** Server time (ms): the later row of a person's day wins. */
  at: number;
  person: PersonId;
  date: LocalDate;
  counts: Tally;
}

export interface Totals {
  /** `kind:id` → how many, both of us. */
  all: ReadonlyMap<string, number>;
  /** `kind:id` → how many, per person. */
  by: Readonly<Record<PersonId, ReadonlyMap<string, number>>>;
}

/** The latest row of each person's day (ties: the later in the list, the sheet's order). */
export function latestByDay(rows: readonly TallyRow[]): TallyRow[] {
  const latest = new Map<string, TallyRow>();
  for (const r of rows) {
    const k = `${r.person}|${r.date}`;
    const prev = latest.get(k);
    if (!prev || r.at >= prev.at) latest.set(k, r);
  }
  return [...latest.values()];
}

const memo = new WeakMap<readonly TallyRow[], Totals>();

/** Every entry's count, in all and per person. Memoised per row list. */
export function tallyTotals(rows: readonly TallyRow[]): Totals {
  const cached = memo.get(rows);
  if (cached) return cached;
  const all = new Map<string, number>();
  const by: Record<PersonId, Map<string, number>> = { A: new Map(), B: new Map() };
  for (const r of latestByDay(rows)) {
    const mine = by[r.person];
    for (const k in r.counts) {
      const n = r.counts[k];
      all.set(k, (all.get(k) ?? 0) + n);
      mine.set(k, (mine.get(k) ?? 0) + n);
    }
  }
  const out: Totals = { all, by };
  memo.set(rows, out);
  return out;
}

/**
 * An entry's count as the ずかん shows it (「×12」): the tallies' total (or one person's), and at least 1 once it has
 * been found (a find from before tallies, or one whose tally hasn't synced yet).
 */
export function countOf(t: Totals, key: string, found: boolean, person?: PersonId): number {
  const n = (person ? t.by[person] : t.all).get(key) ?? 0;
  return found ? Math.max(1, n) : n;
}

/** The day's tally with one more of `key` (a new object; the count stops at TALLY_MAX_N, a new key past TALLY_MAX_KEYS
 *  is dropped: the row must stay valid). */
export function addToTally(t: Tally, key: string, n = 1): Tally {
  if (!(key in t) && Object.keys(t).length >= TALLY_MAX_KEYS) return t;
  return { ...t, [key]: Math.min(TALLY_MAX_N, (t[key] ?? 0) + n) };
}

/**
 * Two tallies of the same person's day as one: the larger count of each key. The phone seeds its day from the
 * server's row (a reinstall, or the day started on another phone) so the next send never lowers a count.
 */
export function mergeTally(a: Tally, b: Tally): Tally {
  const out: Tally = { ...a };
  let size = Object.keys(out).length;
  for (const k in b) {
    if (k in out) out[k] = Math.max(out[k], b[k]);
    else if (size < TALLY_MAX_KEYS) (out[k] = b[k]), size++;
  }
  return out;
}
