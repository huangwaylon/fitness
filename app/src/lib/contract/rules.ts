// The record's own limits (contract/record.ts checks events against them; the model reads them the same way, and the
// wallets show the prices). Pure.
import type { ShopItemId } from '../types.ts';

/**
 * The wallets' cutover (2026-11-11 04:00 JST, that Wednesday's week lock). Before it: one shared wallet, the rewards at
 * OLD_SHOP's prices (every buy then stays as it was). From it: a wallet per member (model/bells.ts walletAt: each
 * starts with half of what the shared one held, rounded down), the rewards at SHOP's.
 */
export const WALLET_SPLIT_MS = Date.parse('2026-11-11T04:00:00+09:00');

/** The two rewards: a buy must name one of these ids at exactly its price as of the buy (shopPrice). */
export const SHOP = [
  { id: 'snack', bells: 20 },
  { id: 'dinner', bells: 35 }
] as const satisfies readonly { id: ShopItemId; bells: number }[];

/** The prices before WALLET_SPLIT_MS (the shared wallet's). */
const OLD_SHOP: Record<ShopItemId, number> = { snack: 40, dinner: 70 };

/** A reward's price at `at` (a buy's record time, or now), or undefined for anything that isn't one. */
export const shopPrice = (id: unknown, at: number): number | undefined => {
  const item = SHOP.find((x) => x.id === id);
  return item && (at < WALLET_SPLIT_MS ? OLD_SHOP[item.id] : item.bells);
};

/** Read-time checks on event rows: an event outside them is ignored (the server would have refused it). */
export const LIMITS = {
  villagerNameMaxChars: 20
} as const;
