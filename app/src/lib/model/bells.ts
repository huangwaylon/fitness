// The ベル economy on read (ADR 0019): each week's earnings (live until the week locks on its Wednesday 04:00, then
// fixed at the lock), what has landed in the two pots by `now`, the spends replayed against them, and the きろく
// ledger. Pure functions of the reduced State; results are cached per State (a State is never mutated) and, for
// locked weeks, across States of the same sheet revision.
import type { DayBells, FruitBells, FruitKey, HarvestBonus, LocalDate, PersonId, PotBalance, PotKey, RingBells, RingFruit, WeekKey } from '#lib/types.ts';
import { addDays, earnWeek, duoBonus, splitPots, weekDays, weekKeyOf, type EarnInput, type WeekEarning } from '#lib/scoring/index.ts';
import { finalMs, firstWeek, isLockedAt, localDateAt, moveGoalOn, provisionalMs, rowsUpTo, type State } from './state.ts';
import { activityAsOf, metricAsOf, weekDates, type Activity } from './inputs.ts';

const LIVE = Infinity;

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
      moveGoal: moveGoalOn(s, person, date, t)
    })),
    workouts: act.workouts.filter((w) => inWeek(w.date)),
    visits: act.visits.filter((v) => inWeek(v.date)).map(({ id: _id, ...v }) => v)
  };
}

/** @deprecated fields (ADR 0019's four fruits) filled from the ring numbers until the UI has moved: 🍐 = Move. */
export const legacyParts = (r: RingBells): FruitBells => ({ peach: r.peach, coconut: r.coconut, apple: r.apple, pear: r.pear });
export const legacyBadges = (b: Record<RingFruit, boolean>): Record<FruitKey, boolean> => ({ peach: b.peach, coconut: b.coconut, apple: b.apple, pear: b.pear });

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

/** A person's daily ベル of a week, counting only days up to `today` (a future-dated row never earns early). */
export const dailyUpTo = (e: WeekEarning, today: LocalDate): number => e.days.reduce((n, d) => (d.date <= today ? n + d.bells : n), 0);

// ---------- pots and spends ----------

/** An accepted spend (a spend the pot couldn't afford is ignored and never listed). */
export interface LedgerSpend {
  spendId: string;
  at: number;
  by: PersonId;
  pot: PotKey;
  /** The menu item id it was bought from. */
  item: string;
  label: string;
  bells: number;
  voided: boolean;
  voidedAt: number | null;
}

export interface PotsState {
  pots: Record<PotKey, PotBalance>;
  /** Everything earned so far, both people. */
  earned: number;
  /** The economy's weeks up to now, oldest first. */
  weeks: WeekBells[];
  /** Accepted spends in server order. */
  spends: LedgerSpend[];
}

const potsMemo = new WeakMap<State, { now: number; v: PotsState }>();

/**
 * The pots at `now`. Earnings land as they happen: a day's ベル (its current value) count from that day, a week's
 * bonus from its Sunday 19:30. Spends and voids replay in server order; a spend counts only if its pot covered it
 * then (earned by its time − spent so far), so a balance never goes negative, and the buyer's void gives it back.
 */
export function potsAt(s: State, now: number): PotsState {
  const memo = potsMemo.get(s);
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

  const spent: Record<PotKey, number> = { treat: 0, trip: 0 };
  const accepted = new Map<string, LedgerSpend>();
  const spends: LedgerSpend[] = [];
  const voids = s.spendVoids.filter((v) => s.bellSpends.some((x) => x.spendId === v.spendId));
  const ops = [
    ...s.bellSpends.map((rec) => ({ at: rec.at, spend: rec, void: null })),
    ...voids.map((rec) => ({ at: rec.at, spend: null, void: rec }))
  ].sort((x, y) => x.at - y.at || (x.spend ? -1 : 1) - (y.spend ? -1 : 1));
  for (const o of ops) {
    if (o.spend) {
      const sp = o.spend;
      if (splitPots(earnedBy(sp.at))[sp.pot] - spent[sp.pot] < sp.bells) continue; // the pot couldn't cover it: ignored
      spent[sp.pot] += sp.bells;
      const entry: LedgerSpend = { spendId: sp.spendId, at: sp.at, by: sp.person, pot: sp.pot, item: sp.item, label: sp.label, bells: sp.bells, voided: false, voidedAt: null };
      accepted.set(sp.spendId, entry);
      spends.push(entry);
    } else if (o.void) {
      const entry = accepted.get(o.void.spendId);
      if (!entry || entry.voided) continue;
      spent[entry.pot] -= entry.bells;
      entry.voided = true;
      entry.voidedAt = o.void.at;
    }
  }
  const split = splitPots(earned);
  const pot = (k: PotKey): PotBalance => ({ balance: split[k] - spent[k], earned: split[k], spent: spent[k] });
  const v: PotsState = { pots: { treat: pot('treat'), trip: pot('trip') }, earned, weeks, spends };
  potsMemo.set(s, { now, v });
  return v;
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
  /** @deprecated ADR 0019's four (🍐 = Move). Read `ringBadges`. */
  badges: Record<PersonId, Record<FruitKey, boolean>>;
  locked: boolean;
}

export interface BellsLedger {
  pots: Record<PotKey, PotBalance>;
  /** Everything earned so far, both people (= treat.earned + trip.earned). */
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
  const p = potsAt(s, now);
  const today = localDateAt(now);
  const days: LedgerDay[] = [];
  const bonuses: LedgerBonus[] = [];
  for (const w of p.weeks) {
    const locked = isLockedAt(s, w.weekKey, now);
    for (let i = 0; i < 7; i++) {
      const [a, b] = [w.A.days[i], w.B.days[i]];
      if (a.date > today) break;
      const day = (d: typeof a): DayBells => ({ date: d.date, bells: d.bells, rings: { ...d.rings }, parts: legacyParts(d.rings) });
      days.push({ date: a.date, weekKey: w.weekKey, bells: a.bells + b.bells, people: { A: day(a), B: day(b) }, locked });
    }
    if (provisionalMs(w.weekKey) <= now) {
      bonuses.push({
        weekKey: w.weekKey, at: provisionalMs(w.weekKey), bonus: { ...w.bonus }, bells: w.bonusBells,
        ringBadges: { A: { ...w.A.badges }, B: { ...w.B.badges } }, badges: { A: legacyBadges(w.A.badges), B: legacyBadges(w.B.badges) }, locked
      });
    }
  }
  return {
    pots: { treat: { ...p.pots.treat }, trip: { ...p.pots.trip } },
    earned: p.earned,
    days: days.reverse(),
    bonuses: bonuses.reverse(),
    spends: p.spends.map((x) => ({ ...x })).reverse()
  };
}
