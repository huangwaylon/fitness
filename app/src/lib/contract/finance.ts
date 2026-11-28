// The couple's shared money (the /money app; ported from the shared-expense app's money rules): three event types,
// each one slot per id, the record keeping the latest op of each (contract/record.ts).
// - `fin_e` an entry: an expense (`k` 'x') or a settlement (`k` 's': the payer covers none of it, never spend). Its id
//   a UUID, a recurring instance `<template id>#YYYY-MM` (finInstanceId), or an imported row's old id. A delete is
//   `del` (ms) set by an edit, cleared by the next: never the record's removal, so a deleted entry can come back and a
//   recurring month stays recorded.
// - `fin_t` a recurring cost's declaration, never a schedule: every instance is an entry someone records, its id the
//   template's and the month's, so a second tap is a no-op. Retiring sets `to` (inclusive), never a delete, as the
//   instance ids are the only link between a template and the months it has posted.
// - `fin_c` the config, one slot (id 'cfg'): the categories, each person's default share as the payer (independent:
//   they need not sum to 100 %, only the payer's is read) and the note presets.
// Money is integer yen; a share is integer basis points (FIN_BP = 100 %), the payer's own share, so the other person
// owes the rest and a settlement (share 0) needs no special case in the arithmetic (finSplit, finNet).
// Members only: never the guest's to read or write (contract/guest.ts). Shared by the record (relay/src/store.ts: it
// refuses an op these don't read, and checks the balance nightly with finNet) and the /money app (lib/finance/); pure
// and dependency-free (the plain text rules: contract/text.ts).
import type { PersonId } from '../types.ts';
import { isLocalDate } from './api.ts';
import { cleanLine } from './text.ts';
import { isInt, isMs, only } from './ops.ts';

type Rec = Record<string, unknown>;

/** The three event types. @public (relay/src/store.ts) */
export const FIN_TYPES = ['fin_e', 'fin_t', 'fin_c'] as const;
export type FinType = (typeof FIN_TYPES)[number];
/** @public (relay/src/store.ts) */
export const isFinType = (t: unknown): t is FinType => (FIN_TYPES as readonly unknown[]).includes(t);

/** 100 % in basis points: a share is an integer 0…FIN_BP. */
export const FIN_BP = 10_000;
/** An amount at most (yen; at least 1). */
export const FIN_AMT_MAX = 100_000_000;
/** An id's characters at most. */
const FIN_ID = 64;
/** A description's characters at most, a note preset's (code points: one clean line). @public (the /money forms) */
export const FIN_DESC = 200;
/** A category's characters at most. @public (the /money forms) */
export const FIN_CAT = 40;
/** The config's categories at most, its note presets'. */
const FIN_CATS_MAX = 50;
const FIN_NOTES_MAX = 50;
/** The config's one slot id. */
const FIN_CFG_ID = 'cfg';

const ID = /^[A-Za-z0-9#:_-]+$/;
/** A template's id: no `#` (it joins the month in an instance id), short enough that `<id>#YYYY-MM` is an id. */
const TPL_ID = /^[A-Za-z0-9:_-]+$/;
const TPL_ID_MAX = FIN_ID - 8;
const MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** An entry: an expense or a settlement. */
export interface FinEntry {
  id: string;
  k: 'x' | 's';
  d: string;
  amt: number;
  payer: PersonId;
  ps: number;
  desc: string;
  cat: string;
  del?: number;
  imp?: 1;
}

/** A recurring cost's declaration. `amt` null: variable (the form asks each month); `ps` null: the payer's default;
 *  `months` [] every month; `day` clamped to the month (finance/dates.ts dayInMonth). */
export interface FinTemplate {
  id: string;
  desc: string;
  cat: string;
  payer: PersonId;
  amt: number | null;
  ps: number | null;
  months: number[];
  day: number;
  from: string;
  to: string | null;
  del?: number;
}

/** The config. */
export interface FinConfig {
  cats: string[];
  split: Record<PersonId, number>;
  notes: string[];
}

/** The config before anyone writes one: an even default split. */
export const FIN_CFG_DEFAULT: Readonly<FinConfig> = Object.freeze({
  cats: ['Groceries', 'Dining', 'Household', 'Travel', 'Rent', 'Other'],
  split: { A: FIN_BP / 2, B: FIN_BP / 2 },
  notes: []
});

/** An entry's id. */
const isFinId = (v: unknown): v is string => typeof v === 'string' && v.length <= FIN_ID && ID.test(v);
/** A template's id. */
const isTplId = (v: unknown): v is string => typeof v === 'string' && v.length <= TPL_ID_MAX && TPL_ID.test(v);
/** An amount: integer yen, 1…FIN_AMT_MAX. @public (lib/finance/, the /money forms) */
export const isFinYen = (v: unknown): v is number => isInt(v, 1, FIN_AMT_MAX);
/** A share: integer basis points, 0…FIN_BP. @public (lib/finance/) */
export const isBp = (v: unknown): v is number => isInt(v, 0, FIN_BP);
/** A month `YYYY-MM`. @public (lib/finance/) */
export const isMonthKey = (v: unknown): v is string => typeof v === 'string' && MONTH.test(v);
const isPayer = (v: unknown): v is PersonId => v === 'A' || v === 'B';
/** A text as the record keeps it: one clean line (contract/text.ts cleanLine) of at most `max` characters; '' allowed
 *  when `empty`. */
const isClean = (v: unknown, max: number, empty: boolean): v is string => typeof v === 'string' && (v === '' ? empty : cleanLine(v, max) === v);
const isCleanList = (v: unknown, max: number, n: number): v is string[] =>
  Array.isArray(v) && v.length <= n && v.every((s) => isClean(s, max, false)) && new Set(v).size === v.length;
/** The months a template runs in: 1…12, sorted, distinct ([] every month). */
const isMonths = (v: unknown): v is number[] => Array.isArray(v) && v.length <= 12 && v.every((m, i) => isInt(m, 1, 12) && (i === 0 || m > v[i - 1]));

/**
 * An op's data with its texts cleaned as the record keeps them (one clean line each, contract/text.ts; a list's empty
 * items and repeats gone): the record cleans what it's sent, then checks it (finEntryOf, finTemplateOf, finConfigOf).
 * @public (relay/src/store.ts)
 */
export function finClean(type: FinType, d: Rec): Rec {
  const out: Rec = { ...d };
  if (typeof d.desc === 'string') out.desc = cleanLine(d.desc, FIN_DESC);
  if (typeof d.cat === 'string') out.cat = cleanLine(d.cat, FIN_CAT);
  if (type === 'fin_c') {
    const list = (v: unknown, max: number): unknown => (Array.isArray(v) ? [...new Set(v.map((s) => cleanLine(s, max)).filter(Boolean))] : v);
    out.cats = list(d.cats, FIN_CAT);
    out.notes = list(d.notes, FIN_DESC);
  }
  return out;
}

/** An entry from an op's data, its known keys only, each well-formed (texts already clean), or null. `imp` (the
 *  import's mark) only when `imp` is allowed: the record's import sets it, a phone's op carrying it is refused. */
export function finEntryOf(d: Rec, { imp = false }: { imp?: boolean } = {}): FinEntry | null {
  if (!only(d, ['id', 'k', 'd', 'amt', 'payer', 'ps', 'desc', 'cat', 'del', 'imp'])) return null;
  if (!isFinId(d.id) || (d.k !== 'x' && d.k !== 's') || !isLocalDate(d.d) || !isFinYen(d.amt) || !isPayer(d.payer) || !isBp(d.ps)) return null;
  if (d.k === 's' && d.ps !== 0) return null;
  if (!isClean(d.desc, FIN_DESC, true) || !isClean(d.cat, FIN_CAT, true)) return null;
  if (d.del !== undefined && !isMs(d.del)) return null;
  if (d.imp !== undefined && (!imp || d.imp !== 1)) return null;
  return {
    id: d.id, k: d.k, d: d.d, amt: d.amt, payer: d.payer, ps: d.ps, desc: d.desc, cat: d.cat,
    ...(d.del !== undefined && { del: d.del as number }),
    ...(d.imp !== undefined && { imp: 1 as const })
  };
}

/** A template from an op's data, its known keys only, each well-formed (texts already clean), or null. Its id has no
 *  `#` and leaves room for `#YYYY-MM`. A `to` before `from` is allowed (retired in its first month: never ran). */
export function finTemplateOf(d: Rec): FinTemplate | null {
  if (!only(d, ['id', 'desc', 'cat', 'payer', 'amt', 'ps', 'months', 'day', 'from', 'to', 'del'])) return null;
  if (!isTplId(d.id) || !isClean(d.desc, FIN_DESC, false) || !isClean(d.cat, FIN_CAT, true) || !isPayer(d.payer)) return null;
  if ((d.amt !== null && !isFinYen(d.amt)) || (d.ps !== null && !isBp(d.ps)) || !isMonths(d.months) || !isInt(d.day, 1, 31)) return null;
  if (!isMonthKey(d.from) || (d.to !== null && !isMonthKey(d.to))) return null;
  if (d.del !== undefined && !isMs(d.del)) return null;
  return {
    id: d.id, desc: d.desc, cat: d.cat, payer: d.payer, amt: d.amt as number | null, ps: d.ps as number | null,
    months: [...d.months], day: d.day, from: d.from, to: d.to as string | null,
    ...(d.del !== undefined && { del: d.del as number })
  };
}

/** The config from an op's data (`{id: 'cfg', cats, split: {A, B}, notes}`, every key), or null. Categories and
 *  presets: distinct clean lines, at least one category. */
export function finConfigOf(d: Rec): FinConfig | null {
  if (!only(d, ['id', 'cats', 'split', 'notes']) || d.id !== FIN_CFG_ID) return null;
  if (!isCleanList(d.cats, FIN_CAT, FIN_CATS_MAX) || d.cats.length === 0 || !isCleanList(d.notes, FIN_DESC, FIN_NOTES_MAX)) return null;
  const s = d.split;
  if (typeof s !== 'object' || s === null || Array.isArray(s) || !only(s as Rec, ['A', 'B'])) return null;
  const { A, B } = s as Rec;
  if (!isBp(A) || !isBp(B)) return null;
  return { cats: [...d.cats], split: { A, B }, notes: [...d.notes] };
}

/** The slot a `fin_*` op fills (its type's and id's), or null for a malformed id. @public (relay/src/store.ts) */
export function finSlot(type: FinType, d: Rec): string | null {
  if (type === 'fin_c') return d.id === FIN_CFG_ID ? `fin_c|${FIN_CFG_ID}` : null;
  return (type === 'fin_e' ? isFinId(d.id) : isTplId(d.id)) ? `${type}|${d.id}` : null;
}

/** A template's entry id for a month: `<template id>#YYYY-MM`. */
export const finInstanceId = (templateId: string, month: string): string => `${templateId}#${month}`;

/**
 * An amount split between the payer and the other person: the payer's part as the old app rounded it (Math.round of
 * amt × the share as a fraction), the other's the rest, so the two always add back to `amt`: a shared cost never loses or invents a yen.
 * `amt` integer yen (0 allowed: a draft's), `ps` basis points; anything else throws rather than reaching a balance.
 */
export function finSplit(amt: number, ps: number): { payerYen: number; otherYen: number } {
  if (!isInt(amt, 0, FIN_AMT_MAX)) throw new TypeError(`amt must be integer yen 0…${FIN_AMT_MAX}, got ${String(amt)}`);
  if (!isBp(ps)) throw new TypeError(`ps must be integer basis points 0…${FIN_BP}, got ${String(ps)}`);
  // (the old app's arithmetic exactly, sharedfinances money.js splitYen: Math.round(yen × share) on the fraction as a
  // double, so a row moved over keeps its yen to the one: ps / FIN_BP is the same double as the old fraction for every
  // whole-bp share; exact half-up integer maths gave 1 yen more at e.g. ¥45 × 0.7, 31.4999… → 31 there)
  const payerYen = Math.round(amt * (ps / FIN_BP));
  return { payerYen, otherYen: amt - payerYen };
}

/** What the other person owes the payer for an entry (yen). @public (lib/finance/) */
export const finOwed = (e: Pick<FinEntry, 'amt' | 'ps'>): number => finSplit(e.amt, e.ps).otherYen;

/** The balance, all time, from A's side: positive, B owes A. Every live entry (no `del`), expenses and settlements
 *  alike, so a settlement of exactly what's owed brings it to 0. @public (relay/: the nightly fincheck) */
export function finNet(entries: Iterable<Pick<FinEntry, 'amt' | 'ps' | 'payer' | 'del'>>): number {
  let net = 0;
  for (const e of entries) if (e.del === undefined) net += e.payer === 'A' ? finOwed(e) : -finOwed(e);
  return net;
}
