// The shop as each person's phone shows it (docs/design.md "The shop"): their pocket (what they caught, found or
// grew of each sellable kind, contract/pocket.ts, from their day tallies and the field, less what they sold), their
// かいがら and the pieces they bought, the guest's its own. The fold is the record's (contract/shop.ts caughtOf and
// shopLedger), so a row the record would refuse counts for nothing here either. The かいがら are the relay's wallet
// (docs/backend.md#the-wallet: the stored number) and this phone's own unsent ops on top, judged as the record will
// and never below 0; the fold's own かいがら only without a wallet (an older relay). Pure. Never ベル: the economy
// never imports this, and this never imports the economy (deps.test.ts).
//
// Cost: one pass over the tallies (model/tally.ts, memoised) and the person's shop rows, memoised per row list.
import type { LocalDate, Who } from '#lib/types.ts';
import { caughtOf, isSellable, rowConcerns, shopLedger, shopStep, type Ledger, type ShopRowAt } from '#lib/contract/shop.ts';
import type { Wallets } from '#lib/contract/api.ts';
import { dayTallies, type TallyRow } from './tally.ts';
import { farmOfState, type FarmRow } from './farm.ts';
import type { Farm, FarmWater } from '#lib/contract/farm.ts';

/** What the fold reads of the model's State (model/state.ts: never imported here, so the shop never reaches ベル). */
interface ShopState { tallies: readonly TallyRow[]; shop: readonly ShopRowAt[]; farm: readonly FarmRow[]; islandDays: readonly { data: { date: LocalDate; watered: readonly string[] } }[]; wet: readonly LocalDate[]; farmWater: readonly FarmWater[]; wallets?: Wallets }

export interface ShopView {
  /** `kind:id` → how many the pocket holds (only the sellable kinds, only more than none). */
  pocket: ReadonlyMap<string, number>;
  /** The person's かいがら: the relay's wallet + this phone's unsent ops (never below 0); without one (an older relay),
   *  the fold: Σ sells + Σ rewards − Σ buys and starts − what is owed (contract/shop.ts Ledger). */
  shells: number;
  /** The pieces they bought (room codes), in the order bought. */
  owned: readonly string[];
  /** The 英語すごろく games whose reward they were paid (`sg_reward` ids). */
  games: ReadonlySet<string>;
}

const memo = new WeakMap<ShopState['shop'], WeakMap<ShopState['tallies'], WeakMap<Farm, Partial<Record<Who, { w: string; view: ShopView }>>>>>();

const daysMemo = new WeakMap<ShopState['tallies'], Partial<Record<Who, ReturnType<typeof caughtOf>>>>();
/** `who`'s catches by their tallies alone (contract/shop.ts caughtOf without the field), per tally list. */
const caughtOfDays = (tallies: ShopState['tallies'], who: Who): ReturnType<typeof caughtOf> =>
  ((daysMemo.get(tallies) ?? daysMemo.set(tallies, {}).get(tallies)!)[who] ??= caughtOf(dayTallies(tallies).filter((r) => r.person === who)));

/** `who`'s pocket, かいがら and bought pieces. Memoised per State lists. */
export function shopView(s: ShopState, who: Who): ShopView {
  let byTally = memo.get(s.shop);
  if (!byTally) memo.set(s.shop, (byTally = new WeakMap()));
  let byFarm = byTally.get(s.tallies);
  if (!byFarm) byTally.set(s.tallies, (byFarm = new WeakMap()));
  const farm = farmOfState(s);
  let views = byFarm.get(farm);
  if (!views) byFarm.set(farm, (views = {}));
  const wallet = s.wallets?.[who], w = wallet ? `${wallet.h}|${wallet.seq}` : '';
  const hit = views[who];
  if (hit?.w === w) return hit.view;
  // (their days as the record holds them, a day's rows one: dayTallies; a sold catch given back costs its かいがら:
  // contract/shop.ts owedOf, the record's rule; the field's net on top, so a farm tap folds no tally again)
  const { caught: fromDays, back } = caughtOfDays(s.tallies, who);
  const caught = new Map(fromDays);
  for (const [k, n] of farm.net[who] ?? []) caught.set(k, (caught.get(k) ?? 0) + n);
  // (their own rows, and every 英語すごろく reward naming them, whoever sent it: rowConcerns, the record's fan-out; the
  // unsent ones last, onto the wallet when there is one: it holds every row the record acknowledged, none of these)
  const rows = s.shop.filter((r) => rowConcerns(r, who));
  const l: Ledger = shopLedger(caught, wallet ? rows.filter((r) => !r.unsent) : rows, back);
  if (wallet) {
    l.shells = wallet.h;
    for (const r of rows) if (r.unsent) shopStep(l, caught, back, r);
    l.shells = Math.max(0, l.shells);
  }
  const pocket = new Map<string, number>();
  // (the starts bought count in as a sale taken back: contract/shop.ts shopStep; a recipe or a present is in the
  // tallies, never the pocket)
  for (const k of new Set([...caught.keys(), ...l.sold.keys()])) {
    if (!isSellable(k)) continue;
    const left = (caught.get(k) ?? 0) - (l.sold.get(k) ?? 0);
    if (left > 0) pocket.set(k, left);
  }
  const view = { pocket, shells: l.shells, owned: l.owned, games: l.games };
  views[who] = { w, view };
  return view;
}
