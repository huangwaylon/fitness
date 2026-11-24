// The shop as each person's phone shows it (docs/design.md "The shop"): their pocket (what they caught, found or
// grew of each sellable kind, contract/pocket.ts, from their day tallies and the field, less what they sold), their
// かいがら and the pieces they bought, the guest's its own. The fold is the record's (contract/shop.ts caughtOf and
// shopLedger), so a row the record would refuse counts for nothing here either. The かいがら are the relay's wallet
// (docs/backend.md#the-wallet: the stored number) and this phone's own unsent ops on top, judged as the record will
// and never below 0; the fold's own かいがら only without a wallet (an older relay). Pure. Never ベル: the economy
// never imports this, and this never imports the economy (deps.test.ts).
//
// With the relay's stored ledger (docs/backend.md#the-ledger, State `ledgers`): the person's parts as the record keeps
// them and this phone's unsent ops stepped on top (contract/ledger.ts, as the record will): no fold of the history.
// Without one (an older relay), the fold.
//
// Cost: one pass over the tallies (model/tally.ts, memoised) and the person's shop rows, memoised per row list.
import type { LocalDate, Who } from '#lib/types.ts';
import { caughtOf, isSellable, rowConcerns, shopLedger, shopStep, type Ledger, type ShopRowAt } from '#lib/contract/shop.ts';
import type { Wallets } from '#lib/contract/api.ts';
import { dayTallies, unsentTallies, type TallyRow } from './tally.ts';
import { farmOfState, type FarmRow } from './farm.ts';
import type { Farm, FarmWater } from '#lib/contract/farm.ts';
import { copyLedger, emptyLedger, ledgerStep, partInto, pocketMoves, LEDGER_PARTS, type Ledger as Stored, type Ledgers } from '#lib/contract/ledger.ts';

/** What the fold reads of the model's State (model/state.ts: never imported here, so the shop never reaches ベル). */
interface ShopState { tallies: readonly TallyRow[]; shop: readonly ShopRowAt[]; farm: readonly FarmRow[]; islandDays: readonly { data: { date: LocalDate; watered: readonly string[] } }[]; wet: readonly LocalDate[]; farmWater: readonly FarmWater[]; wallets?: Wallets; ledgers?: Ledgers }

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
  /** When each piece was bought (the record's time, ms; a queued buy's its row's): もようがえ's NEW, the day's stock. */
  ownedAt: ReadonlyMap<string, number>;
}

const memo = new WeakMap<ShopState['shop'], WeakMap<ShopState['tallies'], WeakMap<Farm, Partial<Record<Who, { w: string; view: ShopView }>>>>>();

const daysMemo = new WeakMap<ShopState['tallies'], Partial<Record<Who, ReturnType<typeof caughtOf>>>>();
/** `who`'s catches by their tallies alone (contract/shop.ts caughtOf without the field), per tally list. */
const caughtOfDays = (tallies: ShopState['tallies'], who: Who): ReturnType<typeof caughtOf> =>
  ((daysMemo.get(tallies) ?? daysMemo.set(tallies, {}).get(tallies)!)[who] ??= caughtOf(dayTallies(tallies).filter((r) => r.person === who)));

const storedMemo = new WeakMap<object, Stored>();
/** `who`'s stored ledger as the relay last told it (its parts read once a part), or null when there's none. */
function storedOf(l: Ledgers[Who]): Stored | null {
  if (!l?.hp) return null;
  let hit = storedMemo.get(l);
  if (!hit) {
    hit = emptyLedger();
    for (const part of LEDGER_PARTS) if (l[part]) partInto(hit, part, l[part]!.v);
    storedMemo.set(l, hit);
  }
  return hit;
}

const viewMemo = new WeakMap<object, WeakMap<ShopState['shop'], WeakMap<ShopState['tallies'], WeakMap<Farm, ShopView>>>>();

/** `who`'s shop from their stored ledger (ledgers' parts) and this phone's unsent ops: shop rows, tallies, the field's
 *  rows (their pocket changes: the field with them less the field without). */
function storedView(s: ShopState, who: Who, stored: Stored, key: object): ShopView {
  const farm = farmOfState(s);
  const a = viewMemo.get(key) ?? viewMemo.set(key, new WeakMap()).get(key)!;
  const b = a.get(s.shop) ?? a.set(s.shop, new WeakMap()).get(s.shop)!;
  const c = b.get(s.tallies) ?? b.set(s.tallies, new WeakMap()).get(s.tallies)!;
  const hit = c.get(farm);
  if (hit) return hit;
  const l = copyLedger(stored);
  unsentTallies(l, s.tallies, who);
  if (s.farm.some((r) => r.unsent && r.person === who)) {
    const without = farmOfState({ ...s, farm: keptFarm(s.farm) }).net[who] ?? new Map<string, number>(), net = farm.net[who] ?? new Map<string, number>();
    pocketMoves(l, [...new Set([...net.keys(), ...without.keys()])].map((k) => [k, (net.get(k) ?? 0) - (without.get(k) ?? 0)] as const));
  }
  const now = Date.now();
  for (const r of s.shop) if (r.unsent && rowConcerns(r, who)) ledgerStep(l, r, r.at || now);
  const pocket = new Map<string, number>();
  for (const [k, n] of l.p) if (n > 0 && isSellable(k)) pocket.set(k, n);
  const view: ShopView = { pocket, shells: l.h, owned: l.w.map(([c]) => c), games: new Set(l.g.keys()), ownedAt: new Map(l.w.map(([c, t]) => [c, t])) };
  c.set(farm, view);
  return view;
}

const keptMemo = new WeakMap<ShopState['farm'], ShopState['farm']>();
/** The field's rows the record has (not unsent), the same list for the same rows (farmOfState's memo holds). */
const keptFarm = (rows: ShopState['farm']): ShopState['farm'] => keptMemo.get(rows) ?? keptMemo.set(rows, rows.filter((r) => !r.unsent)).get(rows)!;

/** `who`'s pocket, かいがら and bought pieces. Memoised per State lists. */
export function shopView(s: ShopState, who: Who): ShopView {
  const parts = s.ledgers?.[who], stored = storedOf(parts);
  if (stored && parts) return storedView(s, who, stored, parts);
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
  // (when each was bought: its buy's row)
  const ownedAt = new Map<string, number>();
  const bought = new Set(l.owned);
  for (const r of rows) if (r.type === 'buy' && bought.has(r.data.item) && !ownedAt.has(r.data.item)) ownedAt.set(r.data.item, r.at);
  const view = { pocket, shells: l.shells, owned: l.owned, games: l.games, ownedAt };
  views[who] = { w, view };
  return view;
}
