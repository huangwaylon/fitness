// The record's price check of the shop's events (docs/backend.md#events `sell` / `buy` / `buy_starts`): the relay's
// only (relay/src/store.ts), never the phones', so the buy price list (buyPrices.ts, via stock.ts) loads with the shop
// and never with the first load (deps.test.ts pins it). The rows' shapes and the ledger are contract/shop.ts's. Pure.
import { isShopEvent, sellPrice, shopRowOf } from './shop.ts';
import { buyPrice } from './stock.ts';
import { FARM } from './farm.ts';
import { validEventData } from './record.ts';
import { localDateAt, nextDay, prevDay } from './tokyo.ts';
import type { LocalDate } from '../types.ts';

/**
 * Whether the record keeps this `sell`, `buy` or `buy_starts` now (`today`: the server's Tokyo date), cover aside
 * (contract/shop.ts shopRefusal): a sell at most n × its species' price (an app from before a price rise sells at its
 * own lower list; never above the record's); a buy at exactly its piece's price, from the stock of a day from yesterday
 * to tomorrow (a buy queued over midnight, a phone's clock a little ahead); starts at exactly theirs. Which pieces a
 * day's stock holds depends on the island's finds (contract/stock.ts), so the record doesn't check it: the phones only
 * offer the stock.
 */
export function shopPriced(type: 'sell' | 'buy' | 'buy_starts', d: Record<string, unknown>, today: LocalDate): boolean {
  const row = shopRowOf(type, d);
  if (!row) return false;
  if (row.type === 'starts') return row.data.v === row.data.n * FARM.startBuy;
  if (row.type === 'sell') {
    const p = sellPrice(row.data.species);
    return p !== undefined && row.data.v <= row.data.n * p;
  }
  return row.data.price === buyPrice(row.data.item) && row.data.d >= prevDay(today) && row.data.d <= nextDay(today);
}

/** The record's whole check of an event's data (`now`: the server's clock): contract/record.ts validEventData's, and a
 *  shop event's prices. @public (relay/src/store.ts) */
export const validEvent = (type: string, d: Record<string, unknown>, now: number): boolean =>
  validEventData(type, d, now) && (!isShopEvent(type) || shopPriced(type, d, localDateAt(now)));
