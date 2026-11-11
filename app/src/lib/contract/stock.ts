// The shop's stock (docs/design.md "The shop"): STOCK_N pieces a Tokyo day, the first of the buy price list's pieces in
// the day's order (seeded by the date and the island's seed) that the island hadn't found or bought by the day's start
// (`stockOf`'s `found`: components/shop/stock.ts), so both phones agree all day. From UNITS_FROM the day's order keeps
// the pieces cut from one pack together (`unit`: the phones' components/shop/stock.ts packOf), so a day fetches ~5
// packs, not ~14. The phones import it only in the shops' lazy chunks (ShopRoom, VisitorShop) and the record from
// contract/shopCheck.ts, so the buy prices (buyPrices.ts) never ride the first load (deps.test.ts). Pure.
import { BUY } from './buyPrices.ts';
import type { LocalDate } from '../types.ts';
import { shuffle } from '../random.ts';
import { dayRand } from './wet.ts';

/** The pieces a day's stock holds (fewer once the island has found nearly all of them). */
export const STOCK_N = 24;
/** The first Tokyo day whose order goes by units (farm/shop r2, 2026-11-11: a day's packs 737 → 266 KB on average;
 *  the days before keep the order they had). */
export const UNITS_FROM: LocalDate = '2026-11-13';
/** A piece's unit: the pack its model is cut from (a whole pack is fetched for any of its pieces), undefined for a
 *  piece of its own (a loose file). */
export type UnitOf = (item: string) => string | undefined;

/** A piece's buy price in かいがら, or undefined: the shop never sells it. */
export const buyPrice = (item: string): number | undefined => (Object.hasOwn(BUY, item) ? BUY[item] : undefined);

const orderMemo = new Map<string, readonly string[]>();

/** A Tokyo day's order of the whole price list, by the date and the island's seed (the same on every phone); from
 *  UNITS_FROM, with `unit`, the units shuffled (each unit's pieces together, in code order). Memoised. */
function dayOrder(date: LocalDate, unit?: UnitOf): readonly string[] {
  const units = !!unit && date >= UNITS_FROM;
  const key = units ? `${date}u` : date;
  const hit = orderMemo.get(key);
  if (hit) return hit;
  const codes = Object.keys(BUY).sort(), rand = dayRand(date, 'shop');
  let out: string[];
  if (!units) out = shuffle(codes, rand);
  else {
    const by = new Map<string, string[]>();
    for (const c of codes) {
      const u = unit(c) ?? c;
      const list = by.get(u);
      if (list) list.push(c);
      else by.set(u, [c]);
    }
    out = shuffle([...by.keys()].sort(), rand).flatMap((u) => by.get(u)!);
  }
  if (orderMemo.size > 64) orderMemo.clear();
  orderMemo.set(key, out);
  return out;
}

/** A Tokyo day's stock: the first STOCK_N pieces of the day's order not in `found` (room codes: the island's ずかん
 *  finds and anyone's buys as of the day's start, shop/stock.ts), fewer when the island has nearly all of them, none
 *  when it has all (売り切れ). */
export function stockOf(date: LocalDate, found: ReadonlySet<string> = new Set(), unit?: UnitOf): string[] {
  const out: string[] = [];
  for (const c of dayOrder(date, unit)) {
    if (out.length >= STOCK_N) break;
    if (!found.has(c)) out.push(c);
  }
  return out;
}
