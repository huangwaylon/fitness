// The stored ledger (docs/backend.md#the-ledger): each person's かいがら, pocket, owned pieces, 英語すごろく games paid
// and ずかん totals as state the record keeps and updates in place, one op at a time, never a fold of the history.
// Each person (A, B, G) has four parts, each a row of the record's `ledger` table with its own `seq` (relay/src/
// ledger.ts), so a reply carries only the parts an op moved and a phone keeps each part's newest:
//
// - `hp`: `h` the かいがら and `p` the pocket (a pocket kind's key, contract/pocket.ts pocketKey'd, → how many, > 0);
//   together, as a sell moves both.
// - `w`: the pieces bought, in order, each with the record's time it was bought (ms): もようがえ's NEW and the day's
//   stock (components/shop/stock.ts: a piece bought before the day's start leaves it).
// - `g`: the 英語すごろく games whose reward paid this person, each with its day; one older than GAMES_KEEP_DAYS is let
//   go (a reward's day is at most TALLY_PAST_DAYS old, contract/record.ts, so it can't pay twice).
// - `z`: the ずかん's totals (`kind:id` as the tallies have it → the person's tallies less their give-backs, > 0).
//
// The record judges a new op against the parts and steps them in the op's transaction (ledgerStep, tallyStep); a phone
// steps its own unsent ops onto the parts it last heard the same way (model/shop.ts). A give-back takes from the pocket
// and the totals, never below 0, and owes nothing (the user, 2026-11-24: a catch sold before a lost claim race keeps
// its かいがら). Never ベル. Shared by the record and the model; pure.
import { isRec } from './guards.ts';
import { isLocalDate } from './api.ts';
import { isPocketKey, type ShopRow } from './shop.ts';
import { pocketKey } from './pocket.ts';
import { startKey } from './farm.ts';
import type { LocalDate } from '../types.ts';
import { addDays } from './tokyo.ts';

export const LEDGER_PARTS = ['hp', 'w', 'g', 'z'] as const;
export type LedgerPart = (typeof LEDGER_PARTS)[number];

/** One person's ledger, its four parts. */
export interface Ledger {
  h: number;
  p: Map<string, number>;
  w: [string, number][];
  g: Map<string, LocalDate>;
  z: Map<string, number>;
}

export const emptyLedger = (): Ledger => ({ h: 0, p: new Map(), w: [], g: new Map(), z: new Map() });
export const copyLedger = (l: Ledger): Ledger => ({ h: l.h, p: new Map(l.p), w: [...l.w], g: new Map(l.g), z: new Map(l.z) });

/** A game paid is kept this long after its day (past TALLY_PAST_DAYS, the oldest a reward may be dated). */
const GAMES_KEEP_DAYS = 36;

export type LedgerRefusal = 'pocket' | 'wallet' | 'owned' | 'paid';

/** Whether `item` is among the pieces bought. */
const owns = (l: Ledger, item: string): boolean => l.w.some(([c]) => c === item);

const bump = (m: Map<string, number>, k: string, n: number): void => {
  const v = (m.get(k) ?? 0) + n;
  if (v > 0) m.set(k, v);
  else m.delete(k);
};

/** Why `row` is refused against `l` (sell: the pocket; buy: owned, the かいがら; starts: the かいがら; a reward: paid), or
 *  null. A correction is never refused. */
function ledgerRefusal(l: Ledger, row: ShopRow): LedgerRefusal | null {
  if (row.type === 'reward') return l.g.has(row.data.g) ? 'paid' : null;
  if (row.type === 'adjust') return null;
  if (row.type === 'sell') return row.data.n > (l.p.get(row.data.species) ?? 0) ? 'pocket' : null;
  if (row.type === 'starts') return row.data.v > l.h ? 'wallet' : null;
  if (owns(l, row.data.item)) return 'owned';
  return row.data.price > l.h ? 'wallet' : null;
}

/**
 * A shop row (a sell, a buy, starts, a reward of this person's, a correction) into `l` at the record's time `at` (ms),
 * in place: the refusal (and `l` untouched), or null. The parts it moved: `moved` (each of LedgerPart once).
 */
export function ledgerStep(l: Ledger, row: ShopRow, at: number, moved?: Set<LedgerPart>): LedgerRefusal | null {
  const why = ledgerRefusal(l, row);
  if (why) return why;
  if (row.type === 'sell') {
    bump(l.p, row.data.species, -row.data.n);
    l.h += row.data.v;
  } else if (row.type === 'buy') {
    l.h -= row.data.price;
    l.w.push([row.data.item, at]);
    moved?.add('w');
  } else if (row.type === 'starts') {
    l.h -= row.data.v;
    bump(l.p, startKey(row.data.crop), row.data.n);
  } else if (row.type === 'reward') {
    l.h += row.data.v;
    l.g.set(row.data.g, row.data.d);
    moved?.add('g');
  } else l.h = Math.max(0, l.h + row.data.v);
  moved?.add('hp');
  return null;
}

/** The games paid older than GAMES_KEEP_DAYS before `today` let go; whether any went. */
export function pruneGames(l: Ledger, today: LocalDate): boolean {
  const oldest = addDays(today, -GAMES_KEEP_DAYS);
  let any = false;
  for (const [g, d] of l.g) if (d < oldest) l.g.delete(g), (any = true);
  return any;
}

/**
 * A day's tally kept over the one it replaced (`held`: its counts, or none), or a give-back (`back`), into `l` in place:
 * each entry's growth (kept − held: a day's counts only grow, contract/tally.ts mergeTally, so a resend of what was
 * held adds nothing) onto the ずかん's totals and, for a pocket's kind, the pocket (its key pocketKey'd); a give-back's
 * off both, never below 0. The parts it moved into `moved`.
 */
export function tallyStep(l: Ledger, kept: Readonly<Record<string, number>>, held: Readonly<Record<string, number>> | null, back: boolean, moved?: Set<LedgerPart>): void {
  for (const k in kept) {
    const delta = kept[k] - (held?.[k] ?? 0);
    if (delta <= 0) continue;
    const n = back ? -delta : delta;
    bump(l.z, k, n);
    moved?.add('z');
    if (isPocketKey(k)) {
      bump(l.p, pocketKey(k), n);
      moved?.add('hp');
    }
  }
}

/** The field's changes to the pocket (contract/farm.ts: a harvest's vegetables in, a planted start out, a dug-up start
 *  back) into `l`, never below 0. @public (relay/src/store.ts) */
export function pocketMoves(l: Ledger, moves: Iterable<readonly [string, number]>, moved?: Set<LedgerPart>): void {
  for (const [k, n] of moves) {
    if (!n) continue;
    bump(l.p, k, n);
    moved?.add('hp');
  }
}

// ---- the parts on the wire and in the record (JSON)

const sorted = <V>(m: ReadonlyMap<string, V>): [string, V][] => [...m].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

/** A part of `l` as JSON's value. */
export function partJson(l: Ledger, part: LedgerPart): unknown {
  if (part === 'hp') return { h: l.h, p: sorted(l.p) };
  if (part === 'w') return l.w;
  if (part === 'g') return sorted(l.g);
  return sorted(l.z);
}

const isCountList = (x: unknown): x is [string, number][] =>
  Array.isArray(x) && x.every((e) => Array.isArray(e) && e.length === 2 && typeof e[0] === 'string' && Number.isInteger(e[1]) && e[1] > 0);

/** A part's value read into `l` (in place); false when it isn't one (`l` untouched). */
export function partInto(l: Ledger, part: LedgerPart, x: unknown): boolean {
  if (part === 'hp') {
    if (!isRec(x) || !Number.isInteger(x.h) || (x.h as number) < 0 || !isCountList(x.p)) return false;
    l.h = x.h as number;
    l.p = new Map(x.p);
    return true;
  }
  if (part === 'w') {
    if (!Array.isArray(x) || !x.every((e) => Array.isArray(e) && e.length === 2 && typeof e[0] === 'string' && Number.isFinite(e[1]))) return false;
    l.w = (x as [string, number][]).map(([c, t]) => [c, t]);
    return true;
  }
  if (part === 'g') {
    if (!Array.isArray(x) || !x.every((e) => Array.isArray(e) && e.length === 2 && typeof e[0] === 'string' && isLocalDate(e[1]))) return false;
    l.g = new Map(x as [string, LocalDate][]);
    return true;
  }
  if (!isCountList(x)) return false;
  l.z = new Map(x);
  return true;
}
