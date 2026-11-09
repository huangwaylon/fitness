// かう's stock (docs/design.md "The shop"): the day's pieces (contract/shop.ts stockOf) less what the island had by the
// day's start: the shared ずかん's furniture finds (presents, tree gifts, digs: anyone's, the guest's too) and anyone's
// buys. As of the day's start, so a find or a buy mid-day leaves the day's stock as it was, on both phones. And a buy
// from it (here, not in store/actions.ts: the buy prices stay out of the first load).
import { buyPrice, stockOf } from '#lib/contract/stock.ts';
import { localDateAt, ZONE_OFFSET_MS, dateMs } from '#lib/time/dates.ts';
import type { State } from '#lib/model/state.ts';
import { shopView } from '#lib/model/shop.ts';
import { week } from '#lib/store/week.svelte.ts';
import { UNDO_MS, together } from '#lib/store/actions.ts';
import { newId } from '#lib/sync/queue.ts';
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

/** ぜんぶ: the pieces of today's stock I don't have yet (`stock`: stockAt), in its order, and what they cost together. */
export function allOf(stock: readonly string[]): { items: string[]; total: number } {
  const m = week.model;
  const owned = m ? shopView(m.state, m.me).owned : [];
  const items = stock.filter((c) => !owned.includes(c) && buyPrice(c) !== undefined);
  return { items, total: items.reduce((a, c) => a + buyPrice(c)!, 0) };
}

/**
 * Buy all of them (allOf) at once, all or none: one `buy` a piece, one group (the record keeps them in one
 * transaction, relay store.ts group), one undo. Refused (`{ok:false}`) when my かいがら don't cover the lot: never a
 * part of it (which part would be the shop's pick, not mine; one at a time does that).
 */
export function buyAll(stock: readonly string[]): SendResult & { n?: number; total?: number } {
  const m = week.model;
  const { items, total } = allOf(stock);
  if (!m || !items.length || total > shopView(m.state, m.me).shells) return { ok: false };
  const d = localDateAt(m.now), group = newId();
  const r = together(items.map((item) => week.send('buy', { item, price: buyPrice(item)!, d }, { holdMs: UNDO_MS, group })));
  return { ...r, n: items.length, total };
}
