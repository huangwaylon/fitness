// かう's stock (docs/design.md "The shop"): the day's pieces (contract/shop.ts stockOf) less what the island had by the
// day's start: the shared ずかん's furniture finds (presents, tree gifts, digs: anyone's, the guest's too) and anyone's
// buys. As of the day's start, so a find or a buy mid-day leaves the day's stock as it was, on both phones. And a buy
// from it (here, not in store/actions.ts: the buy prices stay out of the first load).
import { buyPrice, stockOf } from '#lib/contract/stock.ts';
import { localDateAt, ZONE_OFFSET_MS, dateMs } from '#lib/time/dates.ts';
import type { State } from '#lib/model/state.ts';
import { shopView } from '#lib/model/shop.ts';
import { week } from '#lib/store/week.svelte.ts';
import { UNDO_MS } from '#lib/store/actions.ts';
import type { SendResult } from '#lib/store/backend.ts';
import { codeOfFind } from '../tent/items.ts';

/** The room codes the island had found or bought before `start` (epoch ms). */
export function foundBefore(s: Pick<State, 'finds' | 'shop'>, start: number): Set<string> {
  const out = new Set<string>();
  for (const f of s.finds) {
    if (f.kind !== 'item' || f.at >= start) continue;
    const c = codeOfFind(f.id);
    if (c) out.add(c);
  }
  for (const r of s.shop) if (r.type === 'buy' && r.at < start) out.add(r.data.item);
  return out;
}

/** The day's stock at `now` (epoch ms): the same on every phone all day. */
export function stockAt(s: Pick<State, 'finds' | 'shop'>, now: number): string[] {
  const date = localDateAt(now);
  return stockOf(date, foundBefore(s, dateMs(date) - ZONE_OFFSET_MS));
}

/** Why I can't buy this piece from today's stock (`stock`: stockAt) now, or null: not in the stock, bought already,
 *  too dear. */
export function buyRefusal(item: string, stock: readonly string[]): 'stock' | 'owned' | 'wallet' | null {
  const m = week.model;
  if (!m || !stock.includes(item)) return 'stock';
  const v = shopView(m.state, m.me);
  if (v.owned.includes(item)) return 'owned';
  return (buyPrice(item) ?? Infinity) > v.shells ? 'wallet' : null;
}

/** Buy a piece of today's stock with my かいがら: it joins my もようがえ. `{ok:false}` when `buyRefusal` says no. */
export function buyPiece(item: string, stock: readonly string[]): SendResult & { price?: number } {
  const m = week.model;
  const price = buyPrice(item);
  if (!m || price === undefined || buyRefusal(item, stock)) return { ok: false };
  return { ...week.send('buy', { item, price, d: localDateAt(m.now) }, { holdMs: UNDO_MS }), price };
}
