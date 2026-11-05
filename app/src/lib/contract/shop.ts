// The shop (docs/design.md "The shop", docs/backend.md#events `sell` / `buy`): each person's pocket of catches, their
// かいがら, and the day's stock. Never ベル: the economy never imports this (deps.test.ts), and nothing here reads one.
//
// - **The pocket** is derived: what a person caught, found or picked up of a kind (the sum of their day tallies,
//   contract/tally.ts: one row per person and day, its counts only ever growing) less what they sold of it (`sell`).
//   No write per catch. What it holds: contract/pocket.ts.
// - **かいがら** are derived too: Σ the sells' values − Σ the buys' prices, per person (the guest's its own).
// - **The stock**: STOCK_N pieces a Tokyo day, picked from the price list's pieces by the date alone (seeded), and the
//   BASICS always; a buy names the day whose stock it was bought from.
//
// A `sell` is `{species, n, v}`: `species` a tally key of the pocket's (`fish:koi`, `shell:coral`, `goods:wood`), `n` how many,
// `v` what they fetched (n × the species' price when sold: kept, so a later price list never rewrites the past). A `buy`
// is `{item, price, d}`: `item` a room's piece (`f…`), `price` its price, `d` the stock's day. The record checks the
// price, the stock and the cover when it keeps one (relay/src/store.ts, `shopRefusal` over `shopLedger`); the phones
// fold the same rows by the same rules (model/shop.ts), a kept row as kept and a queued one as the record would judge
// it. Shared by the record and the model; pure.
import { isLocalDate, nextDay } from './api.ts';
import { SELL, BUY } from './shopPrices.ts';
import type { LocalDate, Who } from '../types.ts';
import { seeded } from '../random.ts';
import { POCKET_KINDS } from './pocket.ts';

export interface SellData { species: string; n: number; v: number }
export interface BuyData { item: string; price: number; d: LocalDate }

/** At most this many of a species in one sell (a day's tally holds at most 999 of it). */
const SELL_MAX_N = 999;
/** The pieces a day's stock holds besides the basics. */
export const STOCK_N = 8;
/** Always in stock (NH's shop keeps its basics): a cardboard box, a zen cushion, a mini cactus set. */
export const BASICS: readonly string[] = ['f3672', 'f7047', 'f4123'];

/** The kinds a pocket holds (contract/pocket.ts: never a present's furniture or recipe). */
const SPECIES_RE = new RegExp(`^(${POCKET_KINDS.join('|')}):[a-z][a-z0-9-]{0,47}$`);
const ITEM_RE = /^f\d{1,6}$/;
const isWhole = (v: unknown, max: number): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= max;
const keysAre = (d: Record<string, unknown>, keys: readonly string[]): boolean => {
  const k = Object.keys(d);
  return k.length === keys.length && keys.every((x) => Object.hasOwn(d, x));
};

/** A species' sell price in かいがら (contract/shopPrices.ts), or undefined: not sellable. */
export const sellPrice = (species: string): number | undefined => (Object.hasOwn(SELL, species) ? SELL[species] : undefined);
/** A piece's buy price in かいがら, or undefined: the shop never sells it. */
export const buyPrice = (item: string): number | undefined => (Object.hasOwn(BUY, item) ? BUY[item] : undefined);

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

/** The calendar day before `date`. */
const prevDay = (date: string): string => new Date(Date.parse(`${date}T00:00:00Z`) - 86400_000).toISOString().slice(0, 10);

/**
 * Whether the record keeps this `sell` or `buy` now (`today`: the server's Tokyo date), cover aside (`shopRefusal`): a
 * sell at most n × its species' price (an app from before a price rise sells at its own lower list; never above the
 * record's); a buy at exactly its piece's price, from the stock of a day from yesterday to
 * tomorrow (a buy queued over midnight, a phone's clock a little ahead), the piece in that day's stock.
 */
export function shopPriced(type: 'sell' | 'buy', d: Record<string, unknown>, today: LocalDate): boolean {
  if (type === 'sell') {
    const s = sellOf(d);
    const p = s ? sellPrice(s.species) : undefined;
    return !!s && p !== undefined && s.v <= s.n * p;
  }
  const b = buyOf(d);
  if (!b || b.price !== buyPrice(b.item)) return false;
  if (b.d < prevDay(today) || b.d > nextDay(today)) return false;
  return stockOf(b.d).includes(b.item);
}

// ---- the stock

const POOL: readonly string[] = Object.keys(BUY).filter((c) => !BASICS.includes(c)).sort();
const stockMemo = new Map<string, readonly string[]>();

/** A Tokyo day's stock: STOCK_N pieces drawn from the price list by the date alone (the same on every phone and the
 *  record), then the BASICS. Memoised. */
export function stockOf(date: LocalDate): readonly string[] {
  const hit = stockMemo.get(date);
  if (hit) return hit;
  const r = seeded(`shop:${date}`);
  const pool = [...POOL];
  const out: string[] = [];
  for (let i = 0; i < STOCK_N && pool.length; i++) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  const all = [...out, ...BASICS.filter((b) => buyPrice(b) !== undefined)];
  if (stockMemo.size > 64) stockMemo.clear();
  stockMemo.set(date, all);
  return all;
}

// ---- the ledger

/** A person's shop as their rows leave it: sold per species (and what they fetched, `soldV`), かいがら (less what is
 *  owed), the pieces bought (in order), and the かいがら owed per species (`owed`: sold catches given back since). */
export interface Ledger { sold: Map<string, number>; soldV: Map<string, number>; shells: number; owned: string[]; owed: Map<string, number> }

/** A row of the shop: a sell or a buy, as `sellOf` / `buyOf` read it; `queued` when the record hasn't kept it yet (a
 *  phone's queue, model/state.ts foldEvents). */
export type ShopRow = ({ type: 'sell'; data: SellData } | { type: 'buy'; data: BuyData }) & { queued?: true };
/** A shop row as the model keeps it (model/state.ts `shop`): whose, and the record's time. */
export type ShopRowAt = ShopRow & { at: number; person: Who };

/** Why the record refuses this one against the ledger (`caught`: the person's tally totals per species), or null:
 *  `pocket` (selling more than the pocket holds), `wallet` (more than the かいがら cover), `owned` (bought already). */
export function shopRefusal(l: Ledger, caught: ReadonlyMap<string, number>, row: ShopRow): 'pocket' | 'wallet' | 'owned' | null {
  if (row.type === 'sell') return row.data.n > (caught.get(row.data.species) ?? 0) - (l.sold.get(row.data.species) ?? 0) ? 'pocket' : null;
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
