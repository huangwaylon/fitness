// The ベル economy on read (ADR 0019, one wallet: ADR 0022): each week's earnings (live until the week locks on its
// Wednesday 04:00, then fixed at the lock), what has landed in the wallet by `now`, the buys replayed against it, the
// shared menu and the きろく ledger. Pure functions of the reduced State; results are cached per State (a State is never mutated) and, for
// locked weeks, across States of the same sheet revision.
import type {
  DayBells, HarvestBonus, LocalDate, MenuItemView, PersonId, RingBells, RingFruit, WalletItem, WalletView, WeekKey
} from '#lib/types.ts';
import { DEFAULT_MENU, ESCALATING_ITEMS, ESCALATION } from '#lib/config/rules.ts';
import { addDays, localDateAt, weekDays, weekKeyOf } from '#lib/time/dates.ts';
import { duoBonus, earnWeek, zeroRings, type EarnInput, type WeekEarning } from '#lib/scoring/bells.ts';
import { finalMs, firstWeek, isLockedAt, latestAt, moveGoalOn, provisionalMs, rowsUpTo, type State } from './state.ts';
import { activityAsOf, gymSetAsOf, metricAsOf, weekDates, type Activity } from './inputs.ts';

/** `t` for an open week: every row counts. */
export const LIVE = Infinity;

/** A week's earnings are live until its lock, then fixed at the lock (a late sync or edit after it never counts). */
export const earnTimeOf = (wk: WeekKey, now: number): number => (now >= finalMs(wk) ? finalMs(wk) : LIVE);

/** One person's week as of t, for `earnWeek`. `act`: their activity as of t covering the week (else derived). */
function earnInput(s: State, person: PersonId, wk: WeekKey, t: number, act: Activity = activityAsOf(s, person, t, weekDates(wk))): EarnInput {
  const dates = weekDays(wk);
  const inWeek = (d: LocalDate) => d >= dates[0] && d <= dates[6];
  return {
    person,
    weekKey: wk,
    days: dates.map((date) => ({
      date,
      steps: metricAsOf(s, person, date, 'steps', t),
      exerciseMin: metricAsOf(s, person, date, 'exercise_min', t),
      moveKcal: metricAsOf(s, person, date, 'move_kcal', t),
      standMin: metricAsOf(s, person, date, 'stand_min', t),
      moveGoal: moveGoalOn(s, person, date, t),
      gymSet: gymSetAsOf(s, person, date, t)
    })),
    workouts: act.workouts.filter((w) => inWeek(w.date)),
    arrivals: act.arrivals.filter((a) => inWeek(a.date))
  };
}

/** Both people's earnings of a week, as of `t` (earnTimeOf). */
export interface WeekBells {
  weekKey: WeekKey;
  t: number;
  A: WeekEarning;
  B: WeekEarning;
  /** The weekly bonus; it lands at the Sunday 19:30 harvest. */
  bonus: HarvestBonus;
  /** bonus.A + bonus.B + bonus.duo. */
  bonusBells: number;
}

function computeWeekBells(s: State, wk: WeekKey, t: number, act?: Partial<Record<PersonId, Activity>>): WeekBells {
  const A = earnWeek(earnInput(s, 'A', wk, t, act?.A));
  const B = earnWeek(earnInput(s, 'B', wk, t, act?.B));
  const bonus = { A: A.bonus, B: B.bonus, duo: duoBonus(A, B) };
  return { weekKey: wk, t, A, B, bonus, bonusBells: bonus.A + bonus.B + bonus.duo };
}

const perState = new WeakMap<State, Map<string, WeekBells>>();
/** Locked weeks across States: keyed by week and the rows stamped by its lock, per `rev`. */
const lockedWeeks = { rev: '', byKey: new Map<string, WeekBells>() };

/**
 * A week's earnings at `now`. `act` (activity as of LIVE covering the week) only saves work for an open week.
 * Don't mutate the result: it is shared.
 */
export function weekBells(s: State, wk: WeekKey, now: number, act?: Partial<Record<PersonId, Activity>>): WeekBells {
  const t = earnTimeOf(wk, now);
  let mine = perState.get(s);
  if (!mine) perState.set(s, (mine = new Map()));
  const key = `${wk}|${t}`;
  let w = mine.get(key);
  if (w) return w;
  if (t !== LIVE && s.rev !== null) {
    if (lockedWeeks.rev !== s.rev) {
      lockedWeeks.byKey.clear();
      lockedWeeks.rev = s.rev;
    }
    const k = `${wk}|${rowsUpTo(s, t)}`;
    w = lockedWeeks.byKey.get(k);
    if (!w) lockedWeeks.byKey.set(k, (w = computeWeekBells(s, wk, t)));
  } else w = computeWeekBells(s, wk, t, t === LIVE ? act : undefined);
  mine.set(key, w);
  return w;
}

/** The weeks that earn, from the economy's first week (the demo's own) to the week of `now`. */
export function economyWeeks(s: State, now: number): WeekKey[] {
  const cur = weekKeyOf(localDateAt(now));
  const out: WeekKey[] = [];
  for (let wk = firstWeek(s); wk <= cur; wk = addDays(wk, 7)) out.push(wk);
  return out;
}

/** A person's earnings of one day (zeros for a date outside the week). */
export function dayBells(e: WeekEarning | undefined, date: LocalDate): { bells: number; rings: RingBells } {
  const d = e?.days.find((x) => x.date === date);
  return { bells: d?.bells ?? 0, rings: d ? { ...d.rings } : zeroRings() };
}

/** A person's daily ベル of a week, counting only days up to `today` (a future-dated row never earns early). */
export const dailyUpTo = (e: WeekEarning, today: LocalDate): number => e.days.reduce((n, d) => (d.date <= today ? n + d.bells : n), 0);

// ---------- the wallet and spends (ADR 0022) ----------

/** The shared menu, one list: the latest valid `pref` menu by either person, else the defaults in the viewer's language. */
function menuAt(s: State, locale: 'ja' | 'en'): WalletItem[] {
  return latestAt(s.menu, Infinity)?.map((x) => ({ ...x })) ?? DEFAULT_MENU.map((x) => ({ id: x.id, label: x.label[locale], bells: x.bells }));
}

/** An item's menu price as of server time t (the latest `pref` menu stamped by then, else the defaults); undefined if not on it. */
function basePriceAt(s: State, item: string, t: number): number | undefined {
  return (latestAt(s.menu, t) ?? DEFAULT_MENU).find((x) => x.id === item)?.bells;
}

/** Whether a menu item id's price rises with each repeat in a week (ESCALATING_ITEMS: keyed by id, so a rename keeps it). */
const escalates = (item: string): boolean => ESCALATING_ITEMS.includes(item);

/**
 * The price of an escalating item's buy after n earlier ones this week: base × 1.5^n (ESCALATION), for n ≥ 1 rounded
 * to the nearest 50 ベル with an exact half rounding down, and never below the base. Exact integer maths (BigInt), so
 * 1,200 → 1,800 → 2,700 → 4,050 and 2,500 → 3,750 → 5,600 (5,625: a half, down) on every engine.
 */
export function treatPrice(base: number, n: number): number {
  if (n <= 0) return base;
  const { num, den, roundTo } = ESCALATION;
  const top = BigInt(base) * BigInt(num) ** BigInt(n);
  const bottom = BigInt(den) ** BigInt(n) * BigInt(roundTo);
  const q = top / bottom;
  const steps = 2n * (top % bottom) > bottom ? q + 1n : q; // > : a remainder of exactly half rounds down
  return Math.max(base, Number(steps) * roundTo);
}

/** Where the escalation counts buys: one item id in one Tokyo week. */
const countKey = (item: string, t: number): string => `${weekKeyOf(localDateAt(t))}|${item}`;
const ENFORCE_FROM = Date.parse(ESCALATION.enforceFrom);

/** An accepted buy (a buy the wallet couldn't cover is ignored and never listed). */
export interface LedgerSpend {
  spendId: string;
  at: number;
  by: PersonId;
  /** The menu item id it was bought from. */
  item: string;
  label: string;
  bells: number;
  voided: boolean;
  voidedAt: number | null;
}

/** The wallet's totals (WalletView without the today / week flow). */
type WalletBalance = Pick<WalletView, 'balance' | 'earned' | 'spent'>;

interface WalletState {
  wallet: WalletBalance;
  /** The economy's weeks up to now, oldest first. */
  weeks: WeekBells[];
  /** Accepted buys in server order. */
  spends: LedgerSpend[];
  /** Accepted, not voided buys per item id in the week of `now`, both people. */
  boughtThisWeek: Map<string, number>;
}

const walletMemo = new WeakMap<State, { now: number; v: WalletState }>();

/**
 * The wallet at `now`. Earnings land as they happen: a day's ベル (its current value) count from that day, a week's
 * bonus from its Sunday 19:30. Buys and voids replay in server order; a buy counts only if the wallet covered it then
 * (earned by its time − spent so far), so the balance never goes negative, and the buyer's void gives it back.
 * An escalating item's buy (from ESCALATION.enforceFrom) must also carry its price at its place in that order:
 * treatPrice(the menu price then, the accepted and not yet voided buys of that id earlier in its week). Two phones
 * buying at once both send the same price; the server's first is accepted, the second no longer matches and is ignored.
 * A void frees its buy for the buys after it (the next price steps back down); buys before it never change.
 */
export function walletAt(s: State, now: number): WalletState {
  const memo = walletMemo.get(s);
  if (memo && memo.now === now) return memo.v;
  const today = localDateAt(now);
  const weeks = economyWeeks(s, now).map((wk) => weekBells(s, wk, now));
  // Earned by time t: the days up to t's date + the bonuses landed by t. Both lists ascend.
  const days: { date: LocalDate; bells: number }[] = [];
  const bonuses: { at: number; bells: number }[] = [];
  for (const w of weeks) {
    for (let i = 0; i < 7; i++) {
      const date = w.A.days[i].date;
      if (date <= today) days.push({ date, bells: w.A.days[i].bells + w.B.days[i].bells });
    }
    if (provisionalMs(w.weekKey) <= now) bonuses.push({ at: provisionalMs(w.weekKey), bells: w.bonusBells });
  }
  const earnedBy = (t: number): number => {
    const d = localDateAt(t);
    let n = 0;
    for (const x of days) {
      if (x.date > d) break;
      n += x.bells;
    }
    for (const x of bonuses) {
      if (x.at > t) break;
      n += x.bells;
    }
    return n;
  };
  const earned = days.reduce((n, x) => n + x.bells, 0) + bonuses.reduce((n, x) => n + x.bells, 0);

  let spent = 0;
  const accepted = new Map<string, LedgerSpend>();
  const counts = new Map<string, number>();
  const spends: LedgerSpend[] = [];
  const voids = s.spendVoids.filter((v) => s.bellSpends.some((x) => x.spendId === v.spendId));
  const ops = [
    ...s.bellSpends.map((rec) => ({ at: rec.at, spend: rec, void: null })),
    ...voids.map((rec) => ({ at: rec.at, spend: null, void: rec }))
  ].sort((x, y) => x.at - y.at || (x.spend ? -1 : 1) - (y.spend ? -1 : 1));
  for (const o of ops) {
    if (o.spend) {
      const sp = o.spend;
      const key = countKey(sp.item, sp.at);
      const n = counts.get(key) ?? 0;
      if (escalates(sp.item) && sp.at >= ENFORCE_FROM) {
        const base = basePriceAt(s, sp.item, sp.at);
        if (base === undefined || sp.bells !== treatPrice(base, n)) continue; // not this week's price: ignored
      }
      if (earnedBy(sp.at) - spent < sp.bells) continue; // the wallet couldn't cover it: ignored
      counts.set(key, n + 1);
      spent += sp.bells;
      const entry: LedgerSpend = {
        spendId: sp.spendId, at: sp.at, by: sp.person, item: sp.item, label: sp.label, bells: sp.bells, voided: false, voidedAt: null
      };
      accepted.set(sp.spendId, entry);
      spends.push(entry);
    } else if (o.void) {
      const entry = accepted.get(o.void.spendId);
      if (!entry || entry.voided) continue;
      spent -= entry.bells;
      const key = countKey(entry.item, entry.at);
      counts.set(key, (counts.get(key) ?? 1) - 1);
      entry.voided = true;
      entry.voidedAt = o.void.at;
    }
  }
  const cur = `${weekKeyOf(today)}|`;
  const boughtThisWeek = new Map<string, number>();
  for (const [k, c] of counts) if (k.startsWith(cur) && c > 0) boughtThisWeek.set(k.slice(cur.length), c);
  const v: WalletState = { wallet: { balance: earned - spent, earned, spent }, weeks, spends, boughtThisWeek };
  walletMemo.set(s, { now, v });
  return v;
}

/**
 * The menu as the wallet shows it at `now`: each item's base, this week's buys of it (both people) and the price of the
 * next buy (treatPrice for an escalating item, else the base).
 */
export function menuView(s: State, locale: 'ja' | 'en', now: number): MenuItemView[] {
  const { boughtThisWeek } = walletAt(s, now);
  return menuAt(s, locale).map((x) => {
    const bought = boughtThisWeek.get(x.id) ?? 0;
    const esc = escalates(x.id);
    return { ...x, basePrice: x.bells, price: esc ? treatPrice(x.bells, bought) : x.bells, boughtThisWeek: bought, escalates: esc };
  });
}

// ---------- the きろく ledger ----------

/** One day of the ledger: both people's earnings. `locked`: its week locked, so the numbers are final. */
export interface LedgerDay {
  date: LocalDate;
  weekKey: WeekKey;
  /** Both people. */
  bells: number;
  people: Record<PersonId, DayBells>;
  locked: boolean;
}

/** A week's bonus row: it lands at the Sunday 19:30 harvest (`at`). */
export interface LedgerBonus {
  weekKey: WeekKey;
  at: number;
  bonus: HarvestBonus;
  /** bonus.A + bonus.B + bonus.duo. */
  bells: number;
  /** The week's five badges per person (ADR 0021). */
  ringBadges: Record<PersonId, Record<RingFruit, boolean>>;
  locked: boolean;
}

export interface BellsLedger {
  wallet: WalletBalance;
  /** Everything earned so far, both people (= wallet.earned). */
  earned: number;
  /** Newest first, from the economy's first day to today. */
  days: LedgerDay[];
  /** Newest first, weeks whose harvest has opened. */
  bonuses: LedgerBonus[];
  /** Newest first. */
  spends: LedgerSpend[];
}

/** The きろく ledger at `now`: every day's earnings, the weekly bonuses and the spends. */
export function bellsLedger(s: State, now: number): BellsLedger {
  const p = walletAt(s, now);
  const today = localDateAt(now);
  const days: LedgerDay[] = [];
  const bonuses: LedgerBonus[] = [];
  for (const w of p.weeks) {
    const locked = isLockedAt(s, w.weekKey, now);
    for (let i = 0; i < 7; i++) {
      const [a, b] = [w.A.days[i], w.B.days[i]];
      if (a.date > today) break;
      const day = (d: typeof a): DayBells => ({ date: d.date, bells: d.bells, rings: { ...d.rings } });
      days.push({ date: a.date, weekKey: w.weekKey, bells: a.bells + b.bells, people: { A: day(a), B: day(b) }, locked });
    }
    if (provisionalMs(w.weekKey) <= now) {
      bonuses.push({
        weekKey: w.weekKey, at: provisionalMs(w.weekKey), bonus: { ...w.bonus }, bells: w.bonusBells,
        ringBadges: { A: { ...w.A.badges }, B: { ...w.B.badges } }, locked
      });
    }
  }
  return {
    wallet: { ...p.wallet },
    earned: p.wallet.earned,
    days: days.reverse(),
    bonuses: bonuses.reverse(),
    spends: p.spends.map((x) => ({ ...x })).reverse()
  };
}
