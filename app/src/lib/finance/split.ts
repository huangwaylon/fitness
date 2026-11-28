// How much of an expense the payer covers: the payer's own share (basis points, contract/finance.ts), so the other owes
// the rest and a settlement (share 0) needs no case of its own. Ported from the shared-expense app's split.js. Pure.
import { FIN_BP, FIN_CFG_DEFAULT, isBp, type FinConfig, type FinEntry } from '#lib/contract/finance.ts';
import type { PersonId } from '#lib/types.ts';

/** The share `payer` covers by default on an expense they paid: their own key, never mirrored from the other's (A
 *  80 % and B 80 % is coherent: each bears 80 % of what they pay). A malformed one is the even split. */
export function defaultSplitFor(config: Pick<FinConfig, 'split'> | null | undefined, payer: PersonId): number {
  const v = config?.split?.[payer];
  return isBp(v) ? v : FIN_CFG_DEFAULT.split[payer];
}

/** The share of an entry `person` bears, whoever paid (basis points): the payer's own, or the rest. A list states
 *  every split from the viewer's side, so one row reads 80 % on one phone and 20 % on the other. */
export const shareFor = (e: Pick<FinEntry, 'payer' | 'ps'>, person: PersonId): number => (person === e.payer ? e.ps : FIN_BP - e.ps);

/** A share as a whole percent, for display only (half up): the one home of that rounding. Never saved back. */
export const percentOf = (bp: number): number => Math.round(bp / 100);
