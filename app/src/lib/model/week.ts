// Compute-on-read: validated state + "now" → the WeekView the UI renders (the island, the wallet, the harvest). The
// ベル economy itself (earnings, the wallet, buys, the menu, the ledger) lives in bells.ts; golden.test.ts pins the views.
import type {
  HarvestView, LocalDate, PersonId, PersonWeekView, RingFruit, RingProgress, WalletView, WeekKey, WeekView
} from '#lib/types.ts';
import { PEOPLE, RING_FRUITS, rulesFor } from '#lib/config/rules.ts';

import { milestoneBells, type WeekEarning } from '#lib/scoring/bells.ts';
import { dailyUpTo, dayBells, LIVE, menuView, walletAt, weekBells, type WeekBells } from './bells.ts';
import { addDays, jstMs, localDateAt, weekKeyOf } from '#lib/time/dates.ts';
import type { Snapshot } from './snapshot.ts';
import { firstWeek, moveGoalOn, partnerOf, provisionalMs, reduce, type State } from './state.ts';
import { activityAsOf, type Activity } from './inputs.ts';


/** Which week's harvest is open at t, given the confirmations so far (Sunday 19:30 until both tapped). */
function harvestWeekAt(s: State, t: number, confirms: Map<WeekKey, Set<PersonId>>): WeekKey | null {
  const cur = weekKeyOf(localDateAt(t));
  for (const wk of [cur, addDays(cur, -7)]) {
    if (t < provisionalMs(wk) || wk < firstWeek(s)) continue;
    return (confirms.get(wk)?.size ?? 0) < 2 ? wk : null;
  }
  return null;
}

/**
 * Accepted harvest taps: only for the week that was open at the time of the tap. The one rule for both the island
 * (`buildWeekView`) and きろく (`historyWeeks`), so a stale or early tap never shows 収穫済 while the island still asks.
 */
export function replayHarvests(s: State, now: number): Map<WeekKey, Set<PersonId>> {
  const confirms = new Map<WeekKey, Set<PersonId>>();
  for (const h of s.harvests) {
    if (h.at > now) break;
    if (harvestWeekAt(s, h.at, confirms) !== h.week) continue;
    const set = confirms.get(h.week) ?? new Set<PersonId>();
    set.add(h.person);
    confirms.set(h.week, set);
  }
  return confirms;
}

// ---------- view ----------

/** A ring fruit's progress today and this week (its ベル count days up to today). */
function ringView(e: WeekEarning, key: RingFruit, today: LocalDate, moveGoal: number): RingProgress {
  const r = rulesFor(e.weekKey);
  const d = e.days.find((x) => x.date === today);
  const amount: Record<RingFruit, [today: number, goal: number]> = {
    peach: [d?.exerciseMin ?? 0, r.goals.exerciseMin],
    pear: [d?.moveKcal ?? 0, d?.moveGoal ?? moveGoal],
    cherry: [d?.standMin ?? 0, r.goals.standMin],
    apple: [d?.steps ?? 0, r.goals.steps],
    coconut: [d?.gym ? 1 : 0, 1]
  };
  const f = e.fruits[key];
  const view: RingProgress = {
    today: amount[key][0], goal: amount[key][1], met: d?.met[key] ?? false, todayBells: d?.rings[key] ?? 0,
    weekDays: f.weekDays, weekGoalDays: f.weekGoalDays, badge: f.badge,
    weekBells: e.days.reduce((n, x) => (x.date <= today ? n + x.rings[key] : n), 0)
  };
  // The milestone fields only exist in a week with a curve, so v1 views stay as they were.
  const pay = key === 'coconut' ? null : milestoneBells(e.weekKey, key);
  if (!pay || !r.curve || key === 'coconut') return view;
  const milestone = d?.milestone?.[key] ?? 0;
  const next = milestone < pay.length ? milestone : null;
  return {
    ...view,
    milestone,
    nextAt: next === null ? null : Math.ceil(r.curve.at[next] * view.goal),
    nextBells: next === null ? null : pay[next],
    nextGain: next === null ? null : pay[next] - view.todayBells
  };
}

/** One person's card. Both players see everything (no privacy filter). */
function personView(s: State, person: PersonId, e: WeekEarning, today: LocalDate): PersonWeekView {
  const pref = s.prefs[person];
  const moveGoal = moveGoalOn(s, person, today);
  const rings = Object.fromEntries(RING_FRUITS.map((k) => [k, ringView(e, k, today, moveGoal)])) as PersonWeekView['rings'];
  return {
    person,
    villagerName: pref.villagerName ?? PEOPLE[person].villager,
    villager: pref.villager ?? null,
    today: dayBells(e, today),
    weekBells: dailyUpTo(e, today),
    rings,
    moveGoal,
    lastSyncAt: s.lastSync[person]
  };
}

/** しずえ's line (usage.test.ts checks every key emitted here exists in ja and en). */
function hostLine(v: Omit<WeekView, 'host'>): WeekView['host'] {
  if (v.harvest && !v.harvest.confirmedBy.includes(v.me)) return { key: 'host.harvest_ready', params: { bells: v.harvest.totalBells } };
  if (v.harvest) return { key: 'host.harvest_waiting', params: { name: v.people[v.partner].villagerName } };
  return { key: 'host.default' };
}

const toMs = (t: Date | string | number): number => (t instanceof Date ? t.getTime() : typeof t === 'number' ? t : Date.parse(t));

/**
 * The WeekView for `me` at `now`, from a snapshot (or an already-reduced state). Rows stamped after `now` still count
 * for open weeks (the server clock may run ahead of the phone); `now` decides which harvests opened and weeks locked.
 */
export function buildWeekView(input: Snapshot | State, me: PersonId, nowArg: Date | string | number): WeekView {
  const s = 'rows' in input ? reduce(input) : input;
  const now = toMs(nowArg);
  const today = localDateAt(now);
  const weekKey = weekKeyOf(today);
  const partner = partnerOf(me);
  // This week and last (the harvest week).
  const dates = { from: addDays(weekKey, -7), to: addDays(weekKey, 6) };
  const act = { A: activityAsOf(s, 'A', LIVE, dates), B: activityAsOf(s, 'B', LIVE, dates) };
  const locale = s.prefs[me].locale ?? 'ja';

  const startOfToday = jstMs(today, 0, 0);
  const earning = weekBells(s, weekKey, now, act);
  const wallet = walletView(s, earning, today, now);
  const menu = menuView(s, locale, now);
  const base: Omit<WeekView, 'host'> = {
    me,
    partner,
    locale,
    weekKey,
    today,
    people: {
      [me]: personView(s, me, earning[me], today),
      [partner]: personView(s, partner, earning[partner], today)
    } as Record<PersonId, PersonWeekView>,
    wallet,
    menu,
    harvest: harvestView(s, now, act),
    highFivesToday: s.highfives.filter((h) => h.person === partner && h.at >= startOfToday && h.at <= now).length
  };
  return { ...base, host: hostLine(base) };
}

/** The wallet at `now`, and what both people earned today and this week (the bonus once it landed). */
function walletView(s: State, cur: WeekBells, today: LocalDate, now: number): WalletView {
  const { wallet } = walletAt(s, now);
  const todayBells = dayBells(cur.A, today).bells + dayBells(cur.B, today).bells;
  const weekBells = dailyUpTo(cur.A, today) + dailyUpTo(cur.B, today) + (provisionalMs(cur.weekKey) <= now ? cur.bonusBells : 0);
  return { ...wallet, today: todayBells, week: weekBells };
}

/** A week's harvest card: its bonus, total and badges (also the demo's `?demo=harvest`). */
export function harvestOf(w: WeekBells, confirmedBy: PersonId[]): HarvestView {
  return {
    weekKey: w.weekKey,
    bonus: { ...w.bonus },
    totalBells: w.A.daily + w.B.daily + w.bonusBells,
    ringBadges: { A: { ...w.A.badges }, B: { ...w.B.badges } },
    confirmedBy
  };
}

/** The open harvest at `now` (Sunday 19:30 until both tapped). */
function harvestView(s: State, now: number, act: Record<PersonId, Activity>): HarvestView | null {
  const confirms = replayHarvests(s, now);
  const wk = harvestWeekAt(s, now, confirms);
  if (!wk) return null;
  return harvestOf(weekBells(s, wk, now, act), [...(confirms.get(wk) ?? [])].sort());
}
