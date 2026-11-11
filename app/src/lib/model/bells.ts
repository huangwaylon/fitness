// The ベル economy on read: each week's earnings (live until the week locks on its Wednesday 04:00, then fixed at the
// lock), what has landed in each member's wallet by `now` (walletAt), the buys replayed against them, and the きろく
// ledger. Pure functions of the reduced State; results are cached per State (a State is never mutated) and, for locked
// weeks, across States of the same sheet revision.
import type { DayBells, LocalDate, PersonId, ShopItemId, WeekKey } from '#lib/types.ts';
import { RULES } from '#lib/config/rules.ts';
import { addDays, localDateAt, weekDays, weekKeyOf } from '#lib/time/dates.ts';
import { earnWeek, noneMet, togetherDays, type EarnInput, type WeekEarning } from '#lib/scoring/bells.ts';
import { finalMs, firstWeek, moveGoalOn, rowsUpTo, stepsGoalOn, type State } from './state.ts';
import { metricAsOf } from './inputs.ts';

/** `t` for an open week: every row counts. */
const LIVE = Infinity;

/** A week's earnings are live until its lock, then fixed at the lock (a late sync after it never counts). */
const earnTimeOf = (wk: WeekKey, now: number): number => (now >= finalMs(wk) ? finalMs(wk) : LIVE);

/** One person's week as of t, for `earnWeek`. */
function earnInput(s: State, person: PersonId, wk: WeekKey, t: number): EarnInput {
  return {
    person,
    weekKey: wk,
    days: weekDays(wk).map((date) => ({
      date,
      steps: metricAsOf(s, person, date, 'steps', t),
      exerciseMin: metricAsOf(s, person, date, 'exercise_min', t),
      moveKcal: metricAsOf(s, person, date, 'move_kcal', t),
      standMin: metricAsOf(s, person, date, 'stand_min', t),
      moveGoal: moveGoalOn(s, person, date, t),
      stepsGoal: stepsGoalOn(s, person, date, t)
    }))
  };
}

/** Both people's earnings of a week, as of `t` (earnTimeOf). */
export interface WeekBells {
  weekKey: WeekKey;
  A: WeekEarning;
  B: WeekEarning;
  /** ふたりでぜんぶ per day, Mon..Sun. */
  together: boolean[];
  /** Per day, Mon..Sun: both people's ベル + RULES.together on a together day. */
  dayTotals: number[];
}

function computeWeekBells(s: State, wk: WeekKey, t: number): WeekBells {
  const A = earnWeek(earnInput(s, 'A', wk, t));
  const B = earnWeek(earnInput(s, 'B', wk, t));
  const together = togetherDays(A, B);
  const dayTotals = A.days.map((d, i) => d.bells + B.days[i].bells + (together[i] ? RULES.together : 0));
  return { weekKey: wk, A, B, together, dayTotals };
}

const perState = new WeakMap<State, Map<string, WeekBells>>();
/** Locked weeks across States: keyed by week and the rows stamped by its lock, per `rev`. */
const lockedWeeks = { rev: '', byKey: new Map<string, WeekBells>() };

/** A week's earnings at `now`. Don't mutate the result: it is shared. */
export function weekBells(s: State, wk: WeekKey, now: number): WeekBells {
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
  } else w = computeWeekBells(s, wk, t);
  mine.set(key, w);
  return w;
}

/** The weeks that earn, from the economy's first week to the week of `now` (none before any data). */
export function economyWeeks(s: State, now: number): WeekKey[] {
  const cur = weekKeyOf(localDateAt(now));
  const out: WeekKey[] = [];
  const first = firstWeek(s);
  if (first !== null) for (let wk = first; wk <= cur; wk = addDays(wk, 7)) out.push(wk);
  return out;
}

/** A person's earnings of one day (nothing for a date outside the week). */
function dayBells(e: WeekEarning, date: LocalDate): DayBells {
  const d = e.days.find((x) => x.date === date);
  return { date, bells: d?.bells ?? 0, met: d ? { ...d.met } : noneMet(), stretch: d?.stretch ?? 0 };
}

/** The week's ベル, counting only days up to `today` (a future-dated row never earns early). */
interface WeekSum { A: number; B: number; together: number; togetherDays: number; total: number }
export function weekSum(w: WeekBells, today: LocalDate): WeekSum {
  const out: WeekSum = { A: 0, B: 0, together: 0, togetherDays: 0, total: 0 };
  w.A.days.forEach((d, i) => {
    if (d.date > today) return;
    out.A += d.bells;
    out.B += w.B.days[i].bells;
    if (w.together[i]) {
      out.togetherDays++;
      out.together += RULES.together;
    }
  });
  out.total = out.A + out.B + out.together;
  return out;
}

// ---------- the wallet and spends ----------

/** An accepted buy (a buy its wallet couldn't cover is ignored and never listed). `day`: the Tokyo day it was for. */
export interface LedgerSpend {
  spendId: string;
  at: number;
  day: LocalDate;
  by: PersonId;
  item: ShopItemId;
  bells: number;
  voided: boolean;
  voidedAt: number | null;
}

/** A member's share of ふたりでぜんぶ on a together day, into their own wallet (RULES.together split evenly). */
const TOGETHER_EACH = RULES.together / 2;

/** A person's ベル of the day at `i` of week `w`: their own, and half of ふたりでぜんぶ on a together day. */
export const ownDayBells = (w: WeekBells, p: PersonId, i: number): number => w[p].days[i].bells + (w.together[i] ? TOGETHER_EACH : 0);

interface WalletState {
  /** What each member can spend now: their own wallet. */
  balance: Record<PersonId, number>;
  /** Both wallets: the guest's ベル row. */
  total: number;
  /** Everything earned, both people. */
  earned: number;
  /** The economy's weeks up to now, oldest first. */
  weeks: WeekBells[];
  /** Accepted buys in server order. */
  spends: LedgerSpend[];
}

const walletMemo = new WeakMap<State, { now: number; v: WalletState }>();

/**
 * The wallets at `now`: one per member from the economy's first day, filled by their own days (ownDayBells, each day's
 * current value, counting from that day). Buys and voids replay in server order: a buy counts only if its buyer's
 * wallet covers it (their days up to the buy's `day` − their buys so far), and a void (by either of us) gives it back to
 * the buyer. No balance ever goes negative.
 */
export function walletAt(s: State, now: number): WalletState {
  const memo = walletMemo.get(s);
  if (memo && memo.now === now) return memo.v;
  const today = localDateAt(now);
  const weeks = economyWeeks(s, now).map((wk) => weekBells(s, wk, now));
  /** Each member's ベル per day, ascending, up to today. */
  const days: { date: LocalDate; A: number; B: number }[] = [];
  for (const w of weeks) {
    w.A.days.forEach((d, i) => {
      if (d.date <= today) days.push({ date: d.date, A: ownDayBells(w, 'A', i), B: ownDayBells(w, 'B', i) });
    });
  }
  /** What `p` earned on days up to `day`. */
  const earnedBy = (p: PersonId, day: LocalDate): number => {
    let n = 0;
    for (const x of days) {
      if (x.date > day) break;
      n += x[p];
    }
    return n;
  };
  const spent: Record<PersonId, number> = { A: 0, B: 0 };
  const accepted = new Map<string, LedgerSpend>();
  const spends: LedgerSpend[] = [];
  const ops = [
    ...s.bellSpends.map((rec) => ({ at: rec.at, spend: rec, void: null })),
    ...s.spendVoids.map((rec) => ({ at: rec.at, spend: null, void: rec }))
  ].sort((x, y) => x.at - y.at || (x.spend ? -1 : 1) - (y.spend ? -1 : 1));
  for (const o of ops) {
    if (o.spend) {
      const sp = o.spend;
      if (earnedBy(sp.person, sp.day) - spent[sp.person] < sp.bells) continue; // the wallet couldn't cover it: ignored
      spent[sp.person] += sp.bells;
      const entry: LedgerSpend = { spendId: sp.spendId, at: sp.at, day: sp.day, by: sp.person, item: sp.item, bells: sp.bells, voided: false, voidedAt: null };
      accepted.set(sp.spendId, entry);
      spends.push(entry);
    } else if (o.void) {
      const entry = accepted.get(o.void.spendId);
      if (!entry || entry.voided) continue;
      spent[entry.by] -= entry.bells;
      entry.voided = true;
      entry.voidedAt = o.void.at;
    }
  }
  const balance = { A: earnedBy('A', today) - spent.A, B: earnedBy('B', today) - spent.B };
  const earned = days.reduce((n, x) => n + x.A + x.B, 0);
  const v: WalletState = { balance, total: balance.A + balance.B, earned, weeks, spends };
  walletMemo.set(s, { now, v });
  return v;
}

// ---------- the きろく ledger ----------

/** One day of the ledger: each person's goals and ふたりでぜんぶ. */
export interface LedgerDay {
  date: LocalDate;
  weekKey: WeekKey;
  /** Both people + ふたりでぜんぶ. */
  bells: number;
  /** Into each one's wallet (ownDayBells): their own and half of ふたりでぜんぶ; together `bells`. */
  own: Record<PersonId, number>;
  people: Record<PersonId, DayBells>;
  together: boolean;
}

export interface BellsLedger {
  /** Everything earned so far, both people. */
  earned: number;
  /** Newest first, from the economy's first day to today. */
  days: LedgerDay[];
  /** Newest first. */
  spends: LedgerSpend[];
}

/** The きろく ledger at `now`: every day's earnings and the spends. */
export function bellsLedger(s: State, now: number): BellsLedger {
  const p = walletAt(s, now);
  const today = localDateAt(now);
  const days: LedgerDay[] = [];
  for (const w of p.weeks) {
    w.A.days.forEach((a, i) => {
      if (a.date > today) return;
      days.push({
        date: a.date, weekKey: w.weekKey, bells: w.dayTotals[i], together: w.together[i], own: { A: ownDayBells(w, 'A', i), B: ownDayBells(w, 'B', i) },
        people: { A: dayBells(w.A, a.date), B: dayBells(w.B, a.date) }
      });
    });
  }
  return { earned: p.earned, days: days.reverse(), spends: p.spends.map((x) => ({ ...x })).reverse() };
}
