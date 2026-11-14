// かう's stock (docs/design.md "The shop"): the day's pieces (contract/stock.ts stockOf) less what the island had by the
// day's start: the shared ずかん's furniture finds (presents, tree gifts, digs: anyone's, the guest's too) and anyone's
// buys. As of the day's start, so a find or a buy mid-day leaves the day's stock as it was, on both phones. And a buy
// from it, one or 全部買う's (here, not in store/actions.ts: the buy prices stay out of the first load).
import { buyPrice, stockOf, type UnitOf } from '#lib/contract/stock.ts';
import { localDateAt, ZONE_OFFSET_MS, dateMs } from '#lib/time/dates.ts';
import type { State } from '#lib/model/state.ts';
import { shopView } from '#lib/model/shop.ts';
import { week } from '#lib/store/week.svelte.ts';
import { UNDO_MS, together } from '#lib/store/actions.ts';
import { newId } from '#lib/sync/queue.ts';
import type { SendResult } from '#lib/store/backend.ts';
import { ITEMS, codeOfFind } from '../tent/items.ts';

/** A piece's pack (tent/items.ts: its model's), the stock's unit (contract/stock.ts: one pack fetched for its pieces). */
export const packOf: UnitOf = (item) => ITEMS[item]?.pk?.[0];

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
  return stockOf(date, foundBefore(s, dateMs(date) - ZONE_OFFSET_MS), packOf);
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

/** The most of one start 苗 takes at once (store/farm.svelte.ts buyStarts). */
export const MAX_STARTS = 99;
/** 苗's row tap for a crop: a field of it, my `free` plots (empty, under the field's cap) less the starts of that crop I
 *  `hold`. Another crop's starts, held or picked, never count: a row's tap is that crop's whole field, a mix is + and −.
 *  At least 1 (no field, or full: one), at most MAX_STARTS. */
export const startsFill = (free: number, hold: number): number => Math.min(MAX_STARTS, Math.max(1, free - hold));

/** 苗's + held down: the wait before repeat `k` (0: the first, HOLD_MS), then HOLD_STEP_MS, ×0.9 quicker each step down
 *  to HOLD_MIN_MS (0 to 99 in about 3.6 s). It stops at MAX_STARTS, on lift, cancel (a scroll took the finger) or leave. */
export const HOLD_MS = 400, HOLD_MIN_MS = 30;
const HOLD_STEP_MS = 80;
export const holdDelay = (k: number): number => (k ? Math.max(HOLD_MIN_MS, Math.round(HOLD_STEP_MS * 0.9 ** (k - 1))) : HOLD_MS);

/** Whether かう shows 苗 before the day's stock: my free plots want more starts than I hold (a planting trip's
 *  errand; else they sit after the stock, a header chip away). */
export const startsFirst = (free: number, held: number): boolean => free > held;

/** How many かいがら short of `price` my `shells` are (0: enough). */
export const shortBy = (price: number, shells: number): number => Math.max(0, price - shells);

/** 全部買う's plan: the pieces it buys (cheapest first) and their `total`; `of`: the pieces of the stock I don't have;
 *  `short`: when it buys none of them, how many かいがら the cheapest wants (0: nothing to buy). */
export interface BuyAll { items: string[]; total: number; of: number; short: number }

/**
 * 全部買う: the pieces of today's `stock` I don't have (`owned`), all of them when my `shells` cover them, else the most
 * pieces they cover, cheapest first (ties: the stock's order). Never the starts (always in stock: the field's). The 11-11
 * all-or-none 全部 almost never fit a wallet (the stock is ~25,000); the confirm lists the pieces before anything is spent.
 */
export function buyAllOf(stock: readonly string[], owned: readonly string[], shells: number, price: (c: string) => number | undefined = buyPrice): BuyAll {
  const left = stock.flatMap((c) => {
    const p = price(c);
    return owned.includes(c) || p === undefined ? [] : [{ c, p }];
  });
  const items: string[] = [];
  let total = 0;
  for (const { c, p } of [...left].sort((a, b) => a.p - b.p)) {
    if (total + p > shells) break;
    items.push(c);
    total += p;
  }
  const short = items.length || !left.length ? 0 : shortBy(Math.min(...left.map((x) => x.p)), shells);
  return { items, total, of: left.length, short };
}

/** Buy `items` of today's stock at once: one `buy` a piece, one group (the record keeps them all or none, relay store.ts
 *  group; a piece my other phone bought meanwhile is dropped alone), one undo. `{ok:false}` when one isn't buyable now
 *  or my かいがら don't cover them together. */
export function buyAll(items: readonly string[], stock: readonly string[]): SendResult & { total?: number } {
  const m = week.model;
  if (!m || !items.length) return { ok: false };
  const v = shopView(m.state, m.me);
  const prices = items.map((c) => (stock.includes(c) && !v.owned.includes(c) ? buyPrice(c) : undefined));
  if (prices.some((p) => p === undefined) || new Set(items).size !== items.length) return { ok: false };
  const total = prices.reduce<number>((a, p) => a + p!, 0);
  if (total > v.shells) return { ok: false };
  const d = localDateAt(m.now), group = newId();
  return { ...together(items.map((item, i) => week.send('buy', { item, price: prices[i]!, d }, { holdMs: UNDO_MS, group }))), total };
}
