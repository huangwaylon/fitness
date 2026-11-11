// A guest's shop (visitorRoles.ts `shop`: Gracie's fine furniture, Wardell's any): a few pieces of the shop's own price
// list (contract/stock.ts buyPrice: NH's ÷20), seeded by the date and the guest, never one in today's stock or one the
// island had by the day's start (shop/stock.ts foundBefore), so both phones see the same. Bought as the shop's are
// (shop/stock.ts buyPiece with this offer as the stock: the record checks the price and the かいがら). Loaded with its
// sheet (VisitorShop.svelte), never in the island's first load (the price list).
import { BUY } from '#lib/contract/buyPrices.ts';
import { stockOf } from '#lib/contract/stock.ts';
import { packOf } from '../shop/stock.ts';
import { shuffle } from '#lib/random.ts';
import { ISLAND_SEED, dayRand } from './daySeed.ts';
import type { GuestId } from './visitorRoles.ts';

/** How many pieces a guest brings, and the dear pool's least price (かいがら). */
const OFFER_N = 6;
const DEAR = 500;

export function offerOf(id: GuestId, pool: 'dear' | 'any', date: string, found: ReadonlySet<string>, seed = ISLAND_SEED): string[] {
  const today = new Set(stockOf(date, found, packOf));
  const all = Object.keys(BUY).sort().filter((c) => !found.has(c) && !today.has(c) && (pool === 'any' || BUY[c] >= DEAR));
  return shuffle(all, dayRand(date, `guest-shop:${id}`, seed)).slice(0, OFFER_N);
}
