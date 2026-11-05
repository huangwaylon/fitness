// The record's own limits (contract/record.ts checks events against them; the model reads them the same way, and the
// wallet shows the prices). Pure.
import type { ShopItemId } from '../types.ts';

/** The two rewards (one shared wallet): a buy must name one of these ids at exactly its price. */
export const SHOP = [
  { id: 'snack', bells: 40 },
  { id: 'dinner', bells: 70 }
] as const satisfies readonly { id: ShopItemId; bells: number }[];

/** A reward's price, or undefined for anything that isn't one. */
export const shopPrice = (id: unknown): number | undefined => SHOP.find((x) => x.id === id)?.bells;

/** Read-time checks on event rows: an event outside them is ignored (the server would have refused it). */
export const LIMITS = {
  villagerNameMaxChars: 20
} as const;
