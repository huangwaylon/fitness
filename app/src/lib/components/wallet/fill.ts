// How full a ごほうび jar looks (Jar.svelte: the panel's wallets, the harvest's).

/** A full jar = this many ベル in a member's wallet (a few months of one person's good weeks saved up). */
const FULL_AT = 150;

/** How full the jar looks (0–1): the square root of the wallet's share of FULL_AT, a little as soon as there is any. */
export function walletFill(bells: number): number {
  return bells <= 0 ? 0 : Math.min(1, Math.max(0.12, Math.sqrt(bells / FULL_AT)));
}
