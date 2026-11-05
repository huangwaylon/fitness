// The shop as each person's phone shows it (docs/design.md "The shop"): their pocket (what they caught of each fish,
// bug and sea creature, from their day tallies, less what they sold), their かいがら and the pieces they bought, the
// guest's its own. The fold is the record's (contract/shop.ts shopLedger), so a row the record would refuse counts for
// nothing here either. Pure. Never ベル: the economy never imports this, and this never imports the economy
// (deps.test.ts).
//
// Cost: one pass over the tallies (model/tally.ts, memoised) and the person's shop rows, memoised per row list.
import type { Who } from '#lib/types.ts';
import { isSellable, shopLedger, type Ledger, type ShopRowAt } from '#lib/contract/shop.ts';
import { dayTallies, tallyTotals, type TallyRow } from './tally.ts';

/** What the fold reads of the model's State (model/state.ts: never imported here, so the shop never reaches ベル). */
interface ShopState { tallies: readonly TallyRow[]; shop: readonly ShopRowAt[] }

export interface ShopView {
  /** `kind:id` → how many the pocket holds (only the sellable kinds, only more than none). */
  pocket: ReadonlyMap<string, number>;
  /** The person's かいがら: Σ sells − Σ buys. */
  shells: number;
  /** The pieces they bought (room codes), in the order bought. */
  owned: readonly string[];
}

const memo = new WeakMap<ShopState['shop'], WeakMap<ShopState['tallies'], Partial<Record<Who, ShopView>>>>();

/** `who`'s caught tally per sellable species (their tallies' totals). */
function caughtBy(s: Pick<ShopState, 'tallies'>, who: Who): Map<string, number> {
  const out = new Map<string, number>();
  for (const [k, n] of tallyTotals(s.tallies).by[who]) if (isSellable(k)) out.set(k, n);
  return out;
}

/** `who`'s given-back counts per sellable species (their `tally_back` days, each day's largest: dayTallies). */
function backBy(s: Pick<ShopState, 'tallies'>, who: Who): Map<string, number> {
  const out = new Map<string, number>();
  for (const r of dayTallies(s.tallies)) {
    if (!r.back || r.person !== who) continue;
    for (const k in r.counts) if (isSellable(k)) out.set(k, (out.get(k) ?? 0) + r.counts[k]);
  }
  return out;
}

/** `who`'s pocket, かいがら and bought pieces. Memoised per State lists. */
export function shopView(s: ShopState, who: Who): ShopView {
  let byTally = memo.get(s.shop);
  if (!byTally) memo.set(s.shop, (byTally = new WeakMap()));
  let views = byTally.get(s.tallies);
  if (!views) byTally.set(s.tallies, (views = {}));
  const hit = views[who];
  if (hit) return hit;
  const caught = caughtBy(s, who);
  // (a sold catch given back costs its かいがら: contract/shop.ts owedOf, the record's rule)
  const l: Ledger = shopLedger(caught, s.shop.filter((r) => r.person === who), backBy(s, who));
  const pocket = new Map<string, number>();
  for (const [k, n] of caught) {
    const left = n - (l.sold.get(k) ?? 0);
    if (left > 0) pocket.set(k, left);
  }
  return (views[who] = { pocket, shells: l.shells, owned: l.owned });
}
