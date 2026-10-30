// The pots' small display rules (ADR 0019 §5): a pot's share of an amount and how full the island's jar looks.
import type { PotKey } from '#lib/types.ts';
import { splitPots } from '#lib/scoring/bells.ts';

/** This pot's share of `total` bells, split the way the pots are (on totals, so the two shares add up). */
export const potShare = (pot: PotKey, total: number): number => splitPots(total)[pot];

/** A full jar on the island = this many bells in the two pots (a little under a trip abroad at 130,000). */
const FULL_AT = 100_000;

/** How full the island's jar looks (0–1): the square root of the pots' share of FULL_AT, a little as soon as there is any. */
export function potFill(bells: number): number {
  return bells <= 0 ? 0 : Math.min(1, Math.max(0.12, Math.sqrt(bells / FULL_AT)));
}
