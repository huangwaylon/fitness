// How full the island's jar looks (ADR 0022: one wallet).

/** A full jar on the island = this many ベル in the wallet (a few weeks of trip treats saved up). */
const FULL_AT = 60_000;

/** How full the jar looks (0–1): the square root of the wallet's share of FULL_AT, a little as soon as there is any. */
export function walletFill(bells: number): number {
  return bells <= 0 ? 0 : Math.min(1, Math.max(0.12, Math.sqrt(bells / FULL_AT)));
}
