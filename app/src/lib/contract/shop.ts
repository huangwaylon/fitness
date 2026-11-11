// The shop (docs/design.md "The shop", docs/backend.md#events `sell` / `buy`): each person's pocket of catches, their
// かいがら, and the day's stock. Never ベル: the economy never imports this (deps.test.ts), and nothing here reads one.
//
// - **The pocket** is derived: what a person caught, found or picked up of a kind (the sum of their day tallies,
//   contract/tally.ts: one row per person and day, its counts only ever growing) less what they sold of it (`sell`).
//   No write per catch. What it holds: contract/pocket.ts.
// - **かいがら** are derived too: Σ the sells' values − Σ the buys' and the starts' prices − what a sold catch given back
//   owes (owedOf), per person (the guest's its own).
// - **The stock** (contract/stock.ts): 24 pieces a Tokyo day, never one the island had by the day's start; a buy names
//   the day whose stock it was bought from.
//
// A `sell` is `{species, n, v}`: `species` a tally key of the pocket's (`fish:koi`, `shell:coral`, `goods:wood`), `n` how many,
// `v` what they fetched (n × the species' price when sold: kept, so a later price list never rewrites the past). A `buy`
// is `{item, price, d}`: `item` a room's piece (`f…`), `price` its price, `d` the stock's day. The record checks the
// price, the stock's day and the cover when it keeps one (not the stock itself: shopPriced) (relay/src/store.ts, `shopRefusal` over `shopLedger`); the phones
// fold the same rows by the same rules (model/shop.ts), a kept row as kept and a queued one as the record would judge
// it. Shared by the record and the model; pure.
import { isLocalDate, keysAre } from './api.ts';
import { SELL } from './shopPrices.ts';
import { buyPrice } from './stock.ts';
import type { LocalDate, Who } from '../types.ts';
import { POCKET_KINDS } from './pocket.ts';
import { nextDay, prevDay } from './tokyo.ts';
import { FARM, isFarmCrop, startKey, type Crop } from './farm.ts';

export interface SellData { species: string; n: number; v: number }
export interface BuyData { item: string; price: number; d: LocalDate }
/** A `buy_starts` (docs/farming.md): `n` starts of a crop for `v` かいがら (n × FARM.startBuy), always in stock. */
interface StartsData { crop: Crop; n: number; v: number }

/** At most this many of a species in one sell (a day's tally holds at most 999 of it). */
const SELL_MAX_N = 999;

/** The kinds a pocket holds (contract/pocket.ts: never a present's furniture or recipe). */
const SPECIES_RE = new RegExp(`^(${POCKET_KINDS.join('|')}):[a-z][a-z0-9-]{0,47}$`);
const ITEM_RE = /^f\d{1,6}$/;
const isWhole = (v: unknown, max: number): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= max;

/** A species' sell price in かいがら (contract/shopPrices.ts), or undefined: not sellable. */
export const sellPrice = (species: string): number | undefined => (Object.hasOwn(SELL, species) ? SELL[species] : undefined);

/** A `sell`'s data as the model reads it: its shape only (the price was the record's rule when it was kept). */
export function sellOf(d: Record<string, unknown>): SellData | null {
  if (!keysAre(d, ['species', 'n', 'v']) || typeof d.species !== 'string' || !SPECIES_RE.test(d.species)) return null;
  if (!isWhole(d.n, SELL_MAX_N) || !isWhole(d.v, 10_000_000)) return null;
  return { species: d.species, n: d.n, v: d.v };
}

/** A `buy`'s data as the model reads it: its shape only. */
export function buyOf(d: Record<string, unknown>): BuyData | null {
  if (!keysAre(d, ['item', 'price', 'd']) || typeof d.item !== 'string' || !ITEM_RE.test(d.item)) return null;
  if (!isWhole(d.price, 1_000_000) || !isLocalDate(d.d)) return null;
  return { item: d.item, price: d.price, d: d.d };
}

/** A `buy_starts`'s data as the model reads it: its shape only. */
function startsOf(d: Record<string, unknown>): StartsData | null {
  if (!keysAre(d, ['crop', 'n', 'v']) || !isFarmCrop(d.crop) || !isWhole(d.n, 99) || !isWhole(d.v, 99 * FARM.startBuy)) return null;
  return { crop: d.crop, n: d.n, v: d.v };
}

/**
 * Whether the record keeps this `sell` or `buy` now (`today`: the server's Tokyo date), cover aside (`shopRefusal`): a
 * sell at most n × its species' price (an app from before a price rise sells at its own lower list; never above the
 * record's); a buy at exactly its piece's price, from the stock of a day from yesterday to tomorrow (a buy queued over
 * midnight, a phone's clock a little ahead). Which pieces a day's stock holds depends on the island's finds
 * (contract/stock.ts), so the record doesn't check it: the phones only offer the stock.
 */
export function shopPriced(type: 'sell' | 'buy' | 'buy_starts', d: Record<string, unknown>, today: LocalDate): boolean {
  if (type === 'buy_starts') {
    // (starts at exactly their price)
    const st = startsOf(d);
    return !!st && st.v === st.n * FARM.startBuy;
  }
  if (type === 'sell') {
    const s = sellOf(d);
    const p = s ? sellPrice(s.species) : undefined;
    return !!s && p !== undefined && s.v <= s.n * p;
  }
  const b = buyOf(d);
  if (!b || b.price !== buyPrice(b.item)) return false;
  return b.d >= prevDay(today) && b.d <= nextDay(today);
}

// ---- the ledger

/** The shop's event types: a sale, a piece bought, a crop's starts bought. @public (relay/src/store.ts) */
export const SHOP_EVENTS = ['sell', 'buy', 'buy_starts'] as const;
export type ShopEvent = (typeof SHOP_EVENTS)[number];
export const isShopEvent = (type: string): type is ShopEvent => (SHOP_EVENTS as readonly string[]).includes(type);

/** A shop event's row for the fold (its data as `sellOf`, `buyOf`, `startsOf` read it), or null when malformed. */
export function shopRowOf(type: ShopEvent, d: Record<string, unknown>): ShopRow | null {
  if (type === 'sell') {
    const data = sellOf(d);
    return data && { type, data };
  }
  if (type === 'buy') {
    const data = buyOf(d);
    return data && { type, data };
  }
  const data = startsOf(d);
  return data && { type: 'starts', data };
}

/** A day's tally of one person's (contract/tally.ts), or the day's give-back (`back`), as the shop reads it. */
export interface TallyDay { back?: boolean; counts: Readonly<Record<string, number>> }

/**
 * What a person's pocket was filled with, as the record and the phones both fold it: per key, Σ their days' tallies
 * − Σ what they gave back, then the field's net (contract/farm.ts: a harvest in, a planted start out); and the
 * given-back counts apart (`back`, for what a sold one owes: owedOf). No floor at 0, on either side: the record's days
 * never give back more than they hold (tally.ts backCovered), and a phone's cache that holds a give-back before its
 * day's tally counts it against the pocket, never for it (the phone then offers less than the record would, never more).
 */
export function caughtOf(days: Iterable<TallyDay>, farmNet: Iterable<readonly [string, number]> = []): { caught: Map<string, number>; back: Map<string, number> } {
  const caught = new Map<string, number>(), back = new Map<string, number>();
  for (const day of days)
    for (const k in day.counts) {
      const n = day.counts[k];
      caught.set(k, (caught.get(k) ?? 0) + (day.back ? -n : n));
      if (day.back) back.set(k, (back.get(k) ?? 0) + n);
    }
  for (const [k, n] of farmNet) caught.set(k, (caught.get(k) ?? 0) + n);
  return { caught, back };
}

/** A person's shop as their rows leave it: sold per species (and what they fetched, `soldV`), かいがら (less what is
 *  owed), the pieces bought (in order), and the かいがら owed per species (`owed`: sold catches given back since). */
export interface Ledger { sold: Map<string, number>; soldV: Map<string, number>; shells: number; owned: string[]; owed: Map<string, number> }

/** A row of the shop: a sell or a buy, as `sellOf` / `buyOf` read it; `queued` when the record hasn't kept it yet (a
 *  phone's queue, model/state.ts foldEvents). */
export type ShopRow = ({ type: 'sell'; data: SellData } | { type: 'buy'; data: BuyData } | { type: 'starts'; data: StartsData }) & { queued?: true };
/** A shop row as the model keeps it (model/state.ts `shop`): whose, and the record's time. */
export type ShopRowAt = ShopRow & { at: number; person: Who };

/** Why the record refuses this one against the ledger (`caught`: the person's tally totals per species), or null:
 *  `pocket` (selling more than the pocket holds), `wallet` (more than the かいがら cover), `owned` (bought already). */
export function shopRefusal(l: Ledger, caught: ReadonlyMap<string, number>, row: ShopRow): 'pocket' | 'wallet' | 'owned' | null {
  if (row.type === 'sell') return row.data.n > (caught.get(row.data.species) ?? 0) - (l.sold.get(row.data.species) ?? 0) ? 'pocket' : null;
  if (row.type === 'starts') return row.data.v > l.shells ? 'wallet' : null;
  if (l.owned.includes(row.data.item)) return 'owned';
  return row.data.price > l.shells ? 'wallet' : null;
}

/**
 * The かいがら owed for `species` (`caught`: its tallies less what was given back; `back`: what was given back): the
 * catches sold that a give-back took back (a claim race lost after the sale, contract/tally.ts tally_back), at what
 * they fetched on average. Only a give-back's: a sale a lower tally uncovers otherwise (a stale one from before the
 * record kept each day's largest counts) owes nothing, as before. A later catch of the species covers the sale again
 * and the debt goes (its かいがら back; the pocket still empty: that catch stands in for the one given back).
 */
function owedOf(l: Ledger, species: string, caught: ReadonlyMap<string, number>, back: ReadonlyMap<string, number>): number {
  const s = l.sold.get(species) ?? 0, c = caught.get(species) ?? 0, b = back.get(species) ?? 0;
  const units = Math.max(0, s - c) - Math.max(0, s - (c + b));
  return units > 0 ? Math.round((units * (l.soldV.get(species) ?? 0)) / s) : 0;
}

/**
 * One person's rows (server order) folded. A row the record kept counts whatever the tallies say now: it was covered
 * when it was kept, so a tally that reads lower since (a stale one, from before the record kept each day's largest
 * counts) never takes back a sale's かいがら or a bought piece; only a piece twice is ignored. A queued row counts only
 * when the ledger covers it (the record would refuse it), so a phone's view never shows a negative wallet. `back`:
 * the person's given-back counts (`caught` is already less them): a sold catch given back costs its かいがら (owedOf),
 * so a sale of a catch that was never theirs buys nothing (2026-11-05: it left the pocket at −n and the かいがら
 * spendable). The ledger's `shells` are less what is owed, and may go below 0 when the かいがら were spent already.
 * The record folds by this (relay/src/store.ts), so the phones and the record agree.
 */
export function shopLedger(caught: ReadonlyMap<string, number>, rows: Iterable<ShopRow>, back: ReadonlyMap<string, number> = new Map()): Ledger {
  const l: Ledger = { sold: new Map(), soldV: new Map(), shells: 0, owned: [], owed: new Map() };
  for (const row of rows) shopStep(l, caught, back, row);
  return l;
}

/** One row into the ledger, as shopLedger folds it (the record's running ledger takes its new rows by this). @public
 *  (relay/src/store.ts) */
export function shopStep(l: Ledger, caught: ReadonlyMap<string, number>, back: ReadonlyMap<string, number>, row: ShopRow): void {
  const why = shopRefusal(l, caught, row);
  if (why === 'owned' || (why && row.queued)) return;
  if (row.type === 'sell') {
    const k = row.data.species;
    l.sold.set(k, (l.sold.get(k) ?? 0) + row.data.n);
    l.soldV.set(k, (l.soldV.get(k) ?? 0) + row.data.v);
    l.shells += row.data.v;
    reowe(l, k, caught, back);
  } else if (row.type === 'starts') {
    // (starts bought count into the pocket as a sale taken back: never owed, contract/farm.ts)
    const k = startKey(row.data.crop);
    l.sold.set(k, (l.sold.get(k) ?? 0) - row.data.n);
    l.shells -= row.data.v;
  } else {
    l.owned.push(row.data.item);
    l.shells -= row.data.price;
  }
}

/** The debt of `species` as the tallies say now (after a sell, or a tally or give-back of it): `shells` moved by its
 *  change. @public (relay/src/store.ts) */
export function reowe(l: Ledger, species: string, caught: ReadonlyMap<string, number>, back: ReadonlyMap<string, number>): void {
  const was = l.owed.get(species) ?? 0, now = owedOf(l, species, caught, back);
  if (now === was) return;
  if (now) l.owed.set(species, now);
  else l.owed.delete(species);
  l.shells -= now - was;
}

/** Whether a tally key sells (a pocket's kind with a price). */
export const isSellable = (key: string): boolean => SPECIES_RE.test(key) && sellPrice(key) !== undefined;
