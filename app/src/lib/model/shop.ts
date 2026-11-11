// The shop as each person's phone shows it (docs/design.md "The shop"): their pocket (what they caught, found or
// grew of each sellable kind, contract/pocket.ts, from their day tallies and the field, less what they sold), their
// かいがら and the pieces they bought, the guest's its own. The fold is the record's (contract/shop.ts caughtOf and
// shopLedger), so a row the record would refuse counts for nothing here either. Pure. Never ベル: the economy never
// imports this, and this never imports the economy (deps.test.ts).
//
// Cost: one pass over the tallies (model/tally.ts, memoised) and the person's shop rows, memoised per row list.
import type { Who } from '#lib/types.ts';
import { caughtOf, isSellable, shopLedger, type Ledger, type ShopRowAt } from '#lib/contract/shop.ts';
import { dayTallies, type TallyRow } from './tally.ts';
import { farmOfState, type FarmRow } from './farm.ts';
import type { Farm } from '#lib/contract/farm.ts';
import type { LocalDate } from '#lib/types.ts';

/** What the fold reads of the model's State (model/state.ts: never imported here, so the shop never reaches ベル). */
interface ShopState { tallies: readonly TallyRow[]; shop: readonly ShopRowAt[]; farm: readonly FarmRow[]; islandDays: readonly { data: { date: LocalDate; watered: readonly string[] } }[]; wet: readonly LocalDate[] }

export interface ShopView {
  /** `kind:id` → how many the pocket holds (only the sellable kinds, only more than none). */
  pocket: ReadonlyMap<string, number>;
  /** The person's かいがら: Σ sells − Σ buys and starts − what is owed (contract/shop.ts Ledger). */
  shells: number;
  /** The pieces they bought (room codes), in the order bought. */
  owned: readonly string[];
}

const memo = new WeakMap<ShopState['shop'], WeakMap<ShopState['tallies'], WeakMap<Farm, Partial<Record<Who, ShopView>>>>>();


/** `who`'s pocket, かいがら and bought pieces. Memoised per State lists. */
export function shopView(s: ShopState, who: Who): ShopView {
  let byTally = memo.get(s.shop);
  if (!byTally) memo.set(s.shop, (byTally = new WeakMap()));
  let byFarm = byTally.get(s.tallies);
  if (!byFarm) byTally.set(s.tallies, (byFarm = new WeakMap()));
  const farm = farmOfState(s);
  let views = byFarm.get(farm);
  if (!views) byFarm.set(farm, (views = {}));
  const hit = views[who];
  if (hit) return hit;
  // (their days as the record holds them, a day's rows one: dayTallies; a sold catch given back costs its かいがら:
  // contract/shop.ts owedOf, the record's rule)
  const net = farm.net[who];
  const { caught, back } = caughtOf(dayTallies(s.tallies).filter((r) => r.person === who), net);
  const l: Ledger = shopLedger(caught, s.shop.filter((r) => r.person === who), back);
  const pocket = new Map<string, number>();
  // (the starts bought count in as a sale taken back: contract/shop.ts shopStep; a recipe or a present is in the
  // tallies, never the pocket)
  for (const k of new Set([...caught.keys(), ...l.sold.keys()])) {
    if (!isSellable(k) && !net?.has(k) && !l.sold.has(k)) continue;
    const left = (caught.get(k) ?? 0) - (l.sold.get(k) ?? 0);
    if (left > 0) pocket.set(k, left);
  }
  return (views[who] = { pocket, shells: l.shells, owned: l.owned });
}
