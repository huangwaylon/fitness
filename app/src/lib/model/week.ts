// Compute-on-read: validated state + "now" → the WeekView the UI renders (the island, the pots, the harvest). The
// ベル economy itself (earnings, pots, spends, the ledger) lives in bells.ts; golden.test.ts pins the views.
import type {
  FruitKey, FruitProgress, HarvestView, LocalDate, MenuItem, PersonId, PersonWeekView, PotFlow, PotKey, PotsView, RingFruit, RingProgress, WeekKey, WeekView
} from '#lib/types.ts';
import { DEFAULT_MENUS, FRUITS, PEOPLE, RING_FRUITS } from '#lib/config/rules.ts';
import { rulesFor } from '#lib/scoring/targets.ts';
import { splitPots, zeroRings, type WeekEarning } from '#lib/scoring/bells.ts';
import { dailyUpTo, legacyBadges, legacyParts, potsAt, weekBells, type WeekBells } from './bells.ts';
import { addDays, nowInZone, weekKeyOf } from '#lib/scoring/index.ts';
import type { Snapshot } from './snapshot.ts';
import { firstWeek, jstMs, latestAt, moveGoalOn, partnerOf, provisionalMs, reduce, type State } from './state.ts';
import { activityAsOf, type Activity } from './inputs.ts';

const LIVE = Infinity;

export { activityAsOf, metricAsOf, weekDates, workoutsAsOf, type Activity } from './inputs.ts';

/** Which week's harvest is open at t, given the confirmations so far (Sunday 19:30 until both tapped). */
function harvestWeekAt(s: State, t: number, confirms: Map<WeekKey, Set<PersonId>>): WeekKey | null {
  const cur = weekKeyOf(nowInZone(new Date(t)).date);
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
  return {
    today: amount[key][0], goal: amount[key][1], met: d?.met[key] ?? false, todayBells: d?.rings[key] ?? 0,
    weekDays: f.weekDays, weekGoalDays: f.weekGoalDays, badge: f.badge,
    weekBells: e.days.reduce((n, x) => (x.date <= today ? n + x.rings[key] : n), 0)
  };
}

/** @deprecated `fruits` (ADR 0019's four) from the ring progress: 🍐 = Move. */
const legacyFruit = (p: RingProgress): FruitProgress => ({
  todayActual: p.today, todayGoal: p.goal, todayMet: p.met, weekDays: p.weekDays, weekGoalDays: p.weekGoalDays, badge: p.badge, weekBells: p.weekBells
});

/** The shared menus: the latest valid `pref` by either person, else the defaults in the viewer's language. */
function menusAt(s: State, locale: 'ja' | 'en'): Record<PotKey, MenuItem[]> {
  const pick = (pot: PotKey): MenuItem[] =>
    latestAt(s.menus[pot], LIVE)?.map((x) => ({ ...x })) ?? DEFAULT_MENUS[pot].map((x) => ({ id: x.id, label: x.label[locale], bells: x.bells }));
  return { treat: pick('treat'), trip: pick('trip') };
}

/** A person's earnings of `today` (zeros outside the week or before the economy). */
function todayOf(e: WeekEarning | undefined, today: LocalDate): PersonWeekView['today'] {
  const d = e?.days.find((x) => x.date === today);
  const rings = d ? { ...d.rings } : zeroRings();
  return { bells: d?.bells ?? 0, rings, parts: legacyParts(rings) };
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
    today: todayOf(e, today),
    weekBells: dailyUpTo(e, today),
    fruits: Object.fromEntries(FRUITS.map((k: FruitKey) => [k, legacyFruit(rings[k])])) as PersonWeekView['fruits'],
    rings,
    moveGoal,
    lastSyncAt: s.lastSync[person]
  };
}

/** しずえ's line: only the keys the island shows (round 16 M5: every key emitted here exists in ja and en; usage.test.ts). */
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
  const z = nowInZone(new Date(now));
  const today = z.date;
  const weekKey = weekKeyOf(today);
  const partner = partnerOf(me);
  // This week and last (the pending questions and the harvest week).
  const dates = { from: addDays(weekKey, -7), to: addDays(weekKey, 6) };
  const act = { A: activityAsOf(s, 'A', LIVE, dates), B: activityAsOf(s, 'B', LIVE, dates) };
  const locale = s.prefs[me].locale ?? 'ja';

  const startOfToday = jstMs(today, 0, 0);
  const earning = weekBells(s, weekKey, now, act);
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
    pots: potsView(s, earning, today, now),
    menus: menusAt(s, locale),
    harvest: harvestView(s, now, act),
    pending: [],
    highFivesToday: s.highfives.filter((h) => h.person === partner && h.at >= startOfToday && h.at <= now).length
  };
  return { ...base, host: hostLine(base) };
}

/**
 * The pots at `now`, and what both people earned today and this week (the bonus once it landed). Each pot's
 * today / week flow is its share of the all-time total minus its share without that part, so the two pots' flows add
 * up exactly to todayBells / weekBells and never disagree with the balances by a rounding ベル.
 */
function potsView(s: State, cur: WeekBells, today: LocalDate, now: number): PotsView {
  const { pots, earned } = potsAt(s, now);
  const todayBells = todayOf(cur.A, today).bells + todayOf(cur.B, today).bells;
  const weekBells = dailyUpTo(cur.A, today) + dailyUpTo(cur.B, today) + (provisionalMs(cur.weekKey) <= now ? cur.bonusBells : 0);
  const [all, beforeToday, beforeWeek] = [splitPots(earned), splitPots(earned - todayBells), splitPots(earned - weekBells)];
  const flow = (k: PotKey): PotFlow => ({ ...pots[k], today: all[k] - beforeToday[k], week: all[k] - beforeWeek[k] });
  return { treat: flow('treat'), trip: flow('trip'), todayBells, weekBells };
}

/** A week's harvest card: its bonus, total and badges (also the demo's `?demo=harvest`). */
export function harvestOf(w: WeekBells, confirmedBy: PersonId[]): HarvestView {
  return {
    weekKey: w.weekKey,
    bonus: { ...w.bonus },
    totalBells: w.A.daily + w.B.daily + w.bonusBells,
    badges: { A: legacyBadges(w.A.badges), B: legacyBadges(w.B.badges) },
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
