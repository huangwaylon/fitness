// The shop's stock (docs/design.md "The shop"): STOCK_N pieces a Tokyo day, the first of the buy price list's pieces in
// the day's order (seeded by the date and the island's seed) that the island hadn't found or bought by the day's start
// (`stockOf`'s `found`: components/shop/stock.ts), so both phones agree all day. The phones import it only in the shops'
// lazy chunks (ShopRoom, VisitorShop) and the record from contract/shopCheck.ts, so the buy prices (buyPrices.ts)
// never ride the first load (deps.test.ts). Pure.
import { BUY } from './buyPrices.ts';
import type { LocalDate } from '../types.ts';
import { shuffle } from '../random.ts';
import { dayRand } from './wet.ts';

/** The pieces a day's stock holds (fewer once the island has found nearly all of them). */
export const STOCK_N = 24;

/** A piece's buy price in かいがら, or undefined: the shop never sells it. */
export const buyPrice = (item: string): number | undefined => (Object.hasOwn(BUY, item) ? BUY[item] : undefined);

const orderMemo = new Map<string, readonly string[]>();

/** A Tokyo day's order of the whole price list, by the date and the island's seed (the same on every phone). Memoised. */
function dayOrder(date: LocalDate): readonly string[] {
  const hit = orderMemo.get(date);
  if (hit) return hit;
  const out = shuffle(Object.keys(BUY).sort(), dayRand(date, 'shop'));
  if (orderMemo.size > 64) orderMemo.clear();
  orderMemo.set(date, out);
  return out;
}

/** A Tokyo day's stock: the first STOCK_N pieces of the day's order not in `found` (room codes: the island's ずかん
 *  finds and anyone's buys as of the day's start, shop/stock.ts), fewer when the island has nearly all of them, none
 *  when it has all (売り切れ). */
export function stockOf(date: LocalDate, found: ReadonlySet<string> = new Set()): string[] {
  const out: string[] = [];
  for (const c of dayOrder(date)) {
    if (out.length >= STOCK_N) break;
    if (!found.has(c)) out.push(c);
  }
  return out;
}
