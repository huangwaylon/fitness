// The trips' packing lists and private notes (docs/travel.md "Packing list (relay)", docs/backend.md#events `pack`,
// `pack_chk`, `pack_reset`, `trip_note`). Built like the board (contract/board.ts): one op per thing, the latest `at`
// wins (then G over B over A), a removal is final, so the record and every phone reach the same list whatever order the
// ops come in.
// - `pack` sets a category or an item (its whole state) or removes one. The trip's seed (its data's `packing`, never
//   on the relay) is the list until an op touches an id: a set op overrides a seed id, a removal hides it. A seed id is
//   nobody's (the guest may not change it); an id an op made (`_` + base36, newPackId) is its creator's (`by`), and
//   the guest changes only its own (a category of its own only while every item in it is its own too: packMayEdit,
//   the phone's rule and the record's). The members change anything.
// - `pack_chk` is one person's tick of one item, `pack_reset` one person's "untick all" (their ticks older than it are
//   off): each person writes only their own (the slot is theirs).
// - `trip_note` is a trip's private values (booking refs, names: `{p:key}` tokens in the guide), written by the
//   members (and the admin's load), read by all three keys.
// Shared by the record (relay/src/store.ts), the model (model/state.ts) and the packing UI
// (components/travel/packing.svelte.ts); pure and dependency-free (the plain text rules: contract/text.ts).
import type { Who } from '../types.ts';
import { isWho } from './api.ts';
import { cleanLine } from './text.ts';
import { AHEAD_MS, isMs, newOpId, only } from './ops.ts';
import { beats, Book, foldOnce, type Queued, type Verdict } from './book.ts';

// (who wrote it: the merge's tie-break is a fixed order, A < B < G)
type Rec = Record<string, unknown>;

/** A text in both languages, at least one: shown in the reader's locale, else the other. */
export type L = { ja?: string; en?: string };

/** A trip's packing list as its data has it (lib/travel/trips/*.ts `packing`): the list until someone changes it. A
 *  category's and an item's `id` match SEED_ID; an item's place is its index (`ord` 0, 1, 2 …), its category's too.
 *  So once a trip's list is in use, a seed only grows at the ends (a new item last in its category, a new category
 *  last) and never reorders: a moved item keeps its `ord`, which would then sit between other seed items. */
export interface PackSeed {
  cats: { id: string; name: L; icon: string; items: { id: string; text: L; note?: L }[] }[];
}

/** The four event types. @public (relay/src/store.ts) */
export const PACK_TYPES = ['pack', 'pack_chk', 'pack_reset', 'trip_note'] as const;
type PackType = (typeof PACK_TYPES)[number];
/** @public (relay/src/store.ts) */
export const isPackType = (t: unknown): t is PackType => (PACK_TYPES as readonly unknown[]).includes(t);

/** A name at most (characters: code points), a note's, an icon's (the guide's icon names, `plane-takeoff`, or an emoji).
 *  @public (the packing UI's fields) */
export const PACK_NAME = 80;
const PACK_NOTE = 120;
const PACK_ICON = 32;
/** At most this many `pack` rows a trip, and `pack_chk` rows a trip and person: a new one past them drops the oldest
 *  removal of an id an op made (a seed id's removal is kept: dropped, the seed item would come back), else is refused. */
const PACK_MAX = 300;
/** A trip note's keys at most, a key's pattern, a value's characters at most (one clean line). */
const NOTE_KEYS = 64;
const NOTE_KEY = /^[A-Za-z0-9_-]{1,40}$/;
const NOTE_CHARS = 500;

/** A trip's id: okinawa, seattle, nz, or any short slug (a new trip needs no relay deploy). */
const TRIP = /^[a-z0-9-]{1,24}$/;
/** A seed id (the trip data's categories and items). */
const SEED_ID = /^[a-z][a-z0-9-]{0,31}$/;
/** An id an op made (newPackId): never a seed id's shape. */
const NEW_ID = /^_[0-9a-z]{6,24}$/;
const ORD_MAX = 1e9;

const isTripId = (v: unknown): v is string => typeof v === 'string' && TRIP.test(v);
const isSeedId = (v: unknown): v is string => typeof v === 'string' && SEED_ID.test(v);
const isNewId = (v: unknown): v is string => typeof v === 'string' && NEW_ID.test(v);
const isPackId = (v: unknown): v is string => isSeedId(v) || isNewId(v);

/** A new category's or item's id (the guest's and the members' alike). */
export const newPackId = (at: number): string => newOpId('_', at);

type PackSet = { trip: string; id: string; at: number; kind: 'cat' | 'item'; cat?: string; ord: number; name: L; note?: L; icon?: string; by?: Who; rm?: undefined };
type PackRm = { trip: string; id: string; at: number; rm: true };
export type PackOp = PackSet | PackRm;
export type PackChk = { trip: string; id: string; at: number; v: 0 | 1 };
export type PackReset = { trip: string; at: number };
export type TripNote = { trip: string; at: number; v: Record<string, string> };

/** A row of one of the four types as the record holds it, with who sent it. */
export type PackRow =
  | { type: 'pack'; who: Who; op: PackOp }
  | { type: 'pack_chk'; who: Who; op: PackChk }
  | { type: 'pack_reset'; who: Who; op: PackReset }
  | { type: 'trip_note'; who: Who; op: TripNote };

/** A text pair cleaned (each side one clean line of at most `max`; an empty side dropped), or null: not an object of
 *  `ja` / `en` strings, or nothing left. */
function cleanL(raw: unknown, max: number): L | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const r = raw as Rec;
  if (!only(r, ['ja', 'en'])) return null;
  const out: L = {};
  for (const k of ['ja', 'en'] as const) {
    if (r[k] === undefined) continue;
    if (typeof r[k] !== 'string') return null;
    const s = cleanLine(r[k], max);
    if (s) out[k] = s;
  }
  return out.ja || out.en ? out : null;
}
/** Whether a text pair is already as cleanL keeps it. */
function isCleanL(raw: unknown, max: number): raw is L {
  const c = cleanL(raw, max);
  if (!c) return false;
  const r = raw as Rec;
  return Object.keys(r).length === Object.keys(c).length && r.ja === c.ja && r.en === c.en;
}
const isIcon = (v: unknown): v is string => typeof v === 'string' && v !== '' && cleanLine(v, PACK_ICON) === v;

/**
 * An op's data with its texts cleaned as the record keeps them (names and notes one clean line, the trip note's values
 * too; an empty side of a pair dropped): the record cleans what it's sent, then checks it (packOpOf). Anything it can't
 * read is passed back as it came (and refused there).
 */
export function packClean(type: string, d: Rec): Rec {
  if (type === 'pack' && d.rm === undefined) {
    const out: Rec = { ...d };
    const name = cleanL(d.name, PACK_NAME);
    if (name) out.name = name;
    if (d.note !== undefined) {
      const note = cleanL(d.note, PACK_NOTE);
      if (note) out.note = note;
      else if (typeof d.note === 'object' && d.note !== null && !Array.isArray(d.note) && only(d.note as Rec, ['ja', 'en'])) delete out.note;
    }
    return out;
  }
  if (type === 'trip_note' && typeof d.v === 'object' && d.v !== null && !Array.isArray(d.v)) {
    const v: Rec = {};
    for (const [k, x] of Object.entries(d.v as Rec)) v[k] = typeof x === 'string' ? cleanLine(x, NOTE_CHARS) : x;
    return { ...d, v };
  }
  return d;
}

/**
 * One of the four types' data, its known keys only, each well-formed (texts already clean), or null. `now`: the
 * record's clock (an `at` more than a day past it is refused); omitted, no bound (the model reads what the record kept).
 */
export function packOpOf(type: 'pack', d: Rec, now?: number): PackOp | null;
export function packOpOf(type: 'pack_chk', d: Rec, now?: number): PackChk | null;
export function packOpOf(type: 'pack_reset', d: Rec, now?: number): PackReset | null;
export function packOpOf(type: 'trip_note', d: Rec, now?: number): TripNote | null;
export function packOpOf(type: string, d: Rec, now?: number): PackOp | PackChk | PackReset | TripNote | null;
export function packOpOf(type: string, d: Rec, now?: number): PackOp | PackChk | PackReset | TripNote | null {
  if (!isTripId(d.trip) || !isMs(d.at) || (now !== undefined && d.at > now + AHEAD_MS)) return null;
  const trip = d.trip, at = d.at;
  switch (type) {
    case 'pack': {
      if (!isPackId(d.id)) return null;
      if (d.rm !== undefined) return d.rm === true && only(d, ['trip', 'id', 'at', 'rm']) ? { trip, id: d.id, at, rm: true } : null;
      if (!only(d, ['trip', 'id', 'at', 'kind', 'cat', 'ord', 'name', 'note', 'icon', 'by'])) return null;
      if (typeof d.ord !== 'number' || !Number.isFinite(d.ord) || Math.abs(d.ord) > ORD_MAX) return null;
      if (!isCleanL(d.name, PACK_NAME)) return null;
      // `by` only on an id an op made: its creator, kept by every later set
      if (isNewId(d.id) ? !isWho(d.by) : d.by !== undefined) return null;
      const op: PackSet = { trip, id: d.id, at, kind: 'item', ord: d.ord, name: { ...d.name } };
      if (d.kind === 'cat') {
        if (d.cat !== undefined || d.note !== undefined || !isIcon(d.icon)) return null;
        op.kind = 'cat';
        op.icon = d.icon;
      } else if (d.kind === 'item') {
        if (!isPackId(d.cat) || d.icon !== undefined) return null;
        op.cat = d.cat;
        if (d.note !== undefined) {
          if (!isCleanL(d.note, PACK_NOTE)) return null;
          op.note = { ...d.note };
        }
      } else return null;
      if (d.by !== undefined) op.by = d.by as Who;
      return op;
    }
    case 'pack_chk':
      return isPackId(d.id) && (d.v === 0 || d.v === 1) && only(d, ['trip', 'id', 'at', 'v']) ? { trip, id: d.id, at, v: d.v } : null;
    case 'pack_reset':
      return only(d, ['trip', 'at']) ? { trip, at } : null;
    case 'trip_note': {
      if (!only(d, ['trip', 'at', 'v']) || typeof d.v !== 'object' || d.v === null || Array.isArray(d.v)) return null;
      const entries = Object.entries(d.v as Rec);
      if (entries.length > NOTE_KEYS) return null;
      const v: Record<string, string> = {};
      for (const [k, x] of entries) {
        if (!NOTE_KEY.test(k) || typeof x !== 'string' || cleanLine(x, NOTE_CHARS) !== x) return null;
        v[k] = x;
      }
      return { trip, at, v };
    }
    default:
      return null;
  }
}

/** A row read from its type, data and sender (null: not one of the four, or malformed). */
export function packRowOf(type: string, d: Rec, who: Who): PackRow | null {
  if (!isPackType(type)) return null;
  const op = packOpOf(type, d);
  return op ? ({ type, who, op } as PackRow) : null;
}

/** The slot a row fills (the record keeps one row a slot): an id's op a trip's, a tick a trip's, item's and person's,
 *  a reset a trip's and person's, a note a trip's. Null for data without a trip (or an id where one is needed). */
export function packSlot(type: string, sender: Who, d: Rec): string | null {
  if (!isTripId(d.trip)) return null;
  switch (type) {
    case 'pack':
      return isPackId(d.id) ? `pack|${d.trip}|${d.id}` : null;
    case 'pack_chk':
      return isPackId(d.id) ? `pack_chk|${d.trip}|${d.id}|${sender}` : null;
    case 'pack_reset':
      return `pack_reset|${d.trip}|${sender}`;
    case 'trip_note':
      return `trip_note|${d.trip}`;
    default:
      return null;
  }
}

/** What the record does with a row (contract/book.ts Verdict): `append` (the slots in `drop` deleted with it: a removal
 *  past the cap, a removed item's ticks), `stale`, `forbidden`, `full` (the trip's cap and nothing to drop) or `owner`
 *  (a set whose `by` isn't its id's creator). */
export type PackVerdict = Verdict<PackRow, 'forbidden' | 'full' | 'owner'>;

/**
 * A trip's packing rows as the record holds them (each slot's latest), with what the rules need counted (`pack` rows a
 * trip, `pack_chk` rows a trip and person): the record builds one from a trip's rows for each op it's sent, the phone
 * folds every row into one (packFold).
 */
export class PackBook extends Book<PackRow, 'forbidden' | 'full' | 'owner'> {
  protected slotOf(r: PackRow): string {
    return packSlot(r.type, r.who, r.op as unknown as Rec)!;
  }
  protected countOf(r: PackRow): string | null {
    return r.type === 'pack' ? `p|${r.op.trip}` : r.type === 'pack_chk' ? `c|${r.op.trip}|${r.who}` : null;
  }

  /** The `pack` row an id holds in a trip (null: none). */
  item(trip: string, id: string): PackRow & { type: 'pack' } | null {
    return (this.rows.get(`pack|${trip}|${id}`) as (PackRow & { type: 'pack' }) | undefined) ?? null;
  }

  /** The items the record holds in a category (a seed item only once an op has moved it there: a category an op made
   *  holds no seed item else). */
  #itemsIn(trip: string, cat: string): { by: Who | null }[] {
    const out: { by: Who | null }[] = [];
    for (const r of this.rows.values()) if (r.type === 'pack' && r.op.trip === trip && !r.op.rm && r.op.kind === 'item' && r.op.cat === cat) out.push({ by: r.op.by ?? null });
    return out;
  }

  /** The oldest removal of an id an op made in a trip (its slot), or null. */
  #oldestGone(trip: string): string | null {
    let best: (PackRow & { type: 'pack' }) | null = null;
    for (const r of this.rows.values())
      if (r.type === 'pack' && r.op.trip === trip && r.op.rm && isNewId(r.op.id) && (!best || r.op.at < best.op.at || (r.op.at === best.op.at && r.op.id < best.op.id))) best = r;
    return best ? `pack|${trip}|${best.op.id}` : null;
  }

  /** The record's rules for a new row (see PackVerdict). */
  accept(r: PackRow): PackVerdict {
    const slot = this.slotOf(r);
    const held = this.rows.get(slot) ?? null;
    switch (r.type) {
      case 'pack': {
        const op = r.op, h = held as (PackRow & { type: 'pack' }) | null;
        // a removal is final: whatever comes after it changes nothing
        if (h?.op.rm) return { v: 'stale' };
        const set = h ? (h.op as PackSet) : null;
        const creator = set ? set.by ?? null : null;
        if (r.who === 'G') {
          // the guest: only ids it made (a seed id is nobody's), a category only while all its items are its own
          if (isSeedId(op.id)) return { v: 'forbidden' };
          if (set && !packMayEdit('G', set.kind === 'cat' ? { by: creator, items: this.#itemsIn(op.trip, op.id) } : { by: creator })) return { v: 'forbidden' };
          if (!set && !op.rm && op.by !== 'G') return { v: 'forbidden' };
        }
        if (!h) {
          // an id an op made and the record doesn't hold: only its creation makes a row (an edit's or a removal's item
          // is gone, or never was)
          if (isNewId(op.id) && (op.rm || op.by !== r.who)) return { v: 'stale' };
        } else {
          if (!beats(r, h)) return { v: 'stale' };
          if (!op.rm && (op.by ?? null) !== creator) return { v: 'owner' };
        }
        const drop: string[] = [];
        if (!h && this.count(`p|${op.trip}`) >= PACK_MAX) {
          const gone = this.#oldestGone(op.trip);
          if (!gone) return { v: 'full' };
          drop.push(gone);
        }
        // a removed item's ticks go with it (a late tick of it is stale: the removal is held, or its id was made by an op)
        if (op.rm) for (const [s, x] of this.rows) if (x.type === 'pack_chk' && x.op.trip === op.trip && x.op.id === op.id) drop.push(s);
        return { v: 'append', row: r, drop };
      }
      case 'pack_chk': {
        const it = this.item(r.op.trip, r.op.id);
        // a tick of a removed item, or of an id an op made that the record doesn't hold
        if (it?.op.rm || (!it && isNewId(r.op.id))) return { v: 'stale' };
        if (held && !beats(r, held)) return { v: 'stale' };
        if (!held && this.count(`c|${r.op.trip}|${r.who}`) >= PACK_MAX) return { v: 'full' };
        return { v: 'append', row: r, drop: [] };
      }
      case 'pack_reset':
        return held && !beats(r, held) ? { v: 'stale' } : { v: 'append', row: r, drop: [] };
      case 'trip_note':
        if (r.who === 'G') return { v: 'forbidden' };
        return held && !beats(r, held) ? { v: 'stale' } : { v: 'append', row: r, drop: [] };
    }
  }
}

/** A row as the model holds it: the record's, or this phone's not yet sent (`queued`). */
export type PackEntry = Queued<PackRow>;

/** The rows as the record keeps them (contract/book.ts Book.fold). */
export const packFold = (rows: Iterable<PackEntry>): PackBook => new PackBook().fold(rows);
/** A model's list folded, once per list (the packing list's store). */
export const packBookOf = foldOnce(packFold);

/** An item on the list. `by`: who made it (null: the seed's); `ticks`: who has it packed (after their reset). */
export interface PackItem { id: string; cat: string; name: L; note?: L; ord: number; seed: boolean; by: Who | null; ticks: Who[] }
export interface PackCat { id: string; name: L; icon: string; ord: number; seed: boolean; by: Who | null; items: PackItem[] }

const byOrd = <T extends { ord: number; id: string }>(a: T, b: T): number => a.ord - b.ord || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const WHO: readonly Who[] = ['A', 'B', 'G'];

/**
 * A trip's list: the seed with the ops over it (a set op replaces its id's whole state, a removal hides it, an id an
 * op made joins), categories and their items by `ord`; an item whose category is gone is hidden with it. Each item's
 * ticks: each person's `pack_chk` v 1 later than their `pack_reset`.
 */
export function packList(trip: string, seed: PackSeed | null | undefined, book: PackBook): PackCat[] {
  const cats = new Map<string, PackCat>();
  const items = new Map<string, PackItem>();
  (seed?.cats ?? []).forEach((c, i) => {
    cats.set(c.id, { id: c.id, name: c.name, icon: c.icon, ord: i, seed: true, by: null, items: [] });
    c.items.forEach((it, j) => items.set(it.id, { id: it.id, cat: c.id, name: it.text, ...(it.note ? { note: it.note } : {}), ord: j, seed: true, by: null, ticks: [] }));
  });
  const resets: Partial<Record<Who, number>> = {};
  const chks: PackRow[] = [];
  for (const r of book.rows.values()) {
    if (r.op.trip !== trip) continue;
    if (r.type === 'pack_reset') resets[r.who] = r.op.at;
    else if (r.type === 'pack_chk') chks.push(r);
    else if (r.type === 'pack') {
      // (a seed-shaped id is nobody's, in this build's seed or not)
      const op = r.op, seeded = isSeedId(op.id);
      cats.delete(op.id);
      items.delete(op.id);
      if (op.rm) continue;
      if (op.kind === 'cat') cats.set(op.id, { id: op.id, name: op.name, icon: op.icon ?? '', ord: op.ord, seed: seeded, by: op.by ?? null, items: [] });
      else items.set(op.id, { id: op.id, cat: op.cat!, name: op.name, ...(op.note ? { note: op.note } : {}), ord: op.ord, seed: seeded, by: op.by ?? null, ticks: [] });
    }
  }
  for (const r of chks) {
    if (r.type !== 'pack_chk' || r.op.v !== 1 || r.op.at <= (resets[r.who] ?? 0)) continue;
    const it = items.get(r.op.id);
    if (it && !it.ticks.includes(r.who)) it.ticks.push(r.who);
  }
  for (const it of items.values()) {
    it.ticks.sort((a, b) => WHO.indexOf(a) - WHO.indexOf(b));
    cats.get(it.cat)?.items.push(it);
  }
  const out = [...cats.values()].sort(byOrd);
  for (const c of out) c.items.sort(byOrd);
  return out;
}

/** Whether `who` may rename, move or remove a category or an item (`by`: its creator, null for the seed's; a category's
 *  `items`): the members anything, the guest only what it made, a category only while every item in it is its own too
 *  (the phone's ✎ and the record's accept alike). */
export const packMayEdit = (who: Who, x: { by: Who | null; items?: readonly { by: Who | null }[] }): boolean =>
  who !== 'G' || (x.by === 'G' && (x.items ?? []).every((i) => i.by === 'G'));

/** An `ord` between two neighbours' (either missing: the list's end); null when there is none left between them (a
 *  float's halves run out after ~50 moves into one gap: the siblings are renumbered then). */
export function ordBetween(before: number | undefined, after: number | undefined): number | null {
  if (before === undefined && after === undefined) return 0;
  if (before === undefined) return after! - 1;
  if (after === undefined) return before + 1;
  const mid = (before + after) / 2;
  return mid > before && mid < after ? mid : null;
}

/** A trip's note (its private values by key), or null: none on the record (yet). */
export function tripNoteOf(trip: string, book: PackBook): Record<string, string> | null {
  const r = book.rows.get(`trip_note|${trip}`);
  return r?.type === 'trip_note' ? r.op.v : null;
}
