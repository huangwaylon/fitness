// Compute-on-read: validated state + "now" → the WeekView the UI renders (the island, the wallet, the harvest). The
// ベル economy itself (earnings, the wallet, buys, the ledger) lives in bells.ts; golden.test.ts pins the views.
import type { HarvestView, LocalDate, PersonId, PersonWeekView, RingFruit, RingProgress, TogetherView, WeekKey, WeekView } from '#lib/types.ts';
import { PEOPLE, RING_FRUITS, RULES } from '#lib/config/rules.ts';
import { noneMet, ringBells, type WeekEarning } from '#lib/scoring/bells.ts';
import { walletAt, weekBells, weekSum, type WeekBells } from './bells.ts';
import { addDays, jstMs, localDateAt, weekKeyOf } from '#lib/time/dates.ts';
import { firstWeek, moveGoalOn, partnerOf, provisionalMs, type State } from './state.ts';

/** Which week's harvest is open at t, given the confirmations so far (Sunday 19:30 until both tapped). */
function harvestWeekAt(s: State, t: number, confirms: Map<WeekKey, Set<PersonId>>): WeekKey | null {
  const cur = weekKeyOf(localDateAt(t));
  for (const wk of [cur, addDays(cur, -7)]) {
    const first = firstWeek(s);
    if (t < provisionalMs(wk) || first === null || wk < first) continue;
    return (confirms.get(wk)?.size ?? 0) < 2 ? wk : null;
  }
  return null;
}

/** Accepted harvest taps: only for the week that was open at the time of the tap. */
function replayHarvests(s: State, now: number): Map<WeekKey, Set<PersonId>> {
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

/** A ring fruit's progress today. */
function ringView(e: WeekEarning, key: RingFruit, today: LocalDate, moveGoal: number): RingProgress {
  const d = e.days.find((x) => x.date === today);
  const amount: Record<RingFruit, [today: number, goal: number]> = {
    pear: [d?.moveKcal ?? 0, d?.moveGoal ?? moveGoal],
    peach: [d?.exerciseMin ?? 0, RULES.goals.exerciseMin],
    cherry: [d?.standMin ?? 0, RULES.goals.standMin],
    apple: [d?.steps ?? 0, RULES.goals.steps]
  };
  return { today: amount[key][0], goal: amount[key][1], met: d?.met[key] ?? false, stretched: d?.stretched[key] ?? false };
}

/** One person's card. Both players see everything (no privacy filter). */
function personView(s: State, person: PersonId, e: WeekEarning, today: LocalDate, weekBells: number): PersonWeekView {
  const pref = s.prefs[person];
  const moveGoal = moveGoalOn(s, person, today);
  const rings = Object.fromEntries(RING_FRUITS.map((k) => [k, ringView(e, k, today, moveGoal)])) as PersonWeekView['rings'];
  const d = e.days.find((x) => x.date === today);
  return {
    person,
    villagerName: pref.villagerName ?? PEOPLE[person].villager,
    villager: pref.villager ?? null,
    today: { bells: d?.bells ?? 0, rings: ringBells(d ?? { met: noneMet(), stretched: noneMet() }) },
    weekBells,
    rings,
    moveGoal,
    lastSyncAt: s.lastSync[person]
  };
}

/** Today's ふたりでぜんぶ: met, or how many goals both people still have to meet. */
function togetherView(w: WeekBells, today: LocalDate): TogetherView {
  const i = w.A.days.findIndex((d) => d.date === today);
  const left = (['A', 'B'] as const).reduce((n, p) => n + RING_FRUITS.filter((f) => !w[p].days[i]?.met[f]).length, 0);
  return { met: w.together[i] ?? false, left };
}

/** しずえ's line (usage.test.ts checks every key emitted here exists in ja and en). */
function hostLine(v: Omit<WeekView, 'host'>): WeekView['host'] {
  if (v.harvest && !v.harvest.confirmedBy.includes(v.me)) return { key: 'host.harvest_ready', params: { bells: v.harvest.totalBells } };
  if (v.harvest) return { key: 'host.harvest_waiting', params: { name: v.people[v.partner].villagerName } };
  return { key: 'host.default' };
}

/**
 * The WeekView for `me` at `now` (server-clock ms). Rows stamped after `now` still count for open weeks (the server
 * clock may run ahead of the phone); `now` decides which harvests opened and weeks locked.
 */
export function buildWeekView(s: State, me: PersonId, now: number): WeekView {
  const today = localDateAt(now);
  const weekKey = weekKeyOf(today);
  const partner = partnerOf(me);
  const locale = s.prefs[me].locale ?? 'ja';

  const startOfToday = jstMs(today, 0, 0);
  const w = weekBells(s, weekKey, now);
  const sum = weekSum(w, today);
  const i = w.A.days.findIndex((d) => d.date === today);
  const base: Omit<WeekView, 'host'> = {
    me,
    partner,
    locale,
    weekKey,
    today,
    people: {
      [me]: personView(s, me, w[me], today, sum[me]),
      [partner]: personView(s, partner, w[partner], today, sum[partner])
    } as Record<PersonId, PersonWeekView>,
    together: togetherView(w, today),
    wallet: { balance: walletAt(s, now).wallet.balance, today: w.dayTotals[i] ?? 0 },
    harvest: harvestView(s, now),
    highFivesToday: s.highfives.filter((h) => h.person === partner && h.at >= startOfToday && h.at <= now).length
  };
  return { ...base, host: hostLine(base) };
}

/** A week's harvest recap: each person's ベル, the ふたりでぜんぶ days and the total (also the demo's `?demo=harvest`). */
export function harvestOf(w: WeekBells, confirmedBy: PersonId[]): HarvestView {
  const sum = weekSum(w, w.A.days[6].date);
  return {
    weekKey: w.weekKey,
    bells: { A: sum.A, B: sum.B, together: sum.together },
    togetherDays: sum.togetherDays,
    totalBells: sum.total,
    confirmedBy
  };
}

/** The open harvest at `now` (Sunday 19:30 until both tapped). */
function harvestView(s: State, now: number): HarvestView | null {
  const confirms = replayHarvests(s, now);
  const wk = harvestWeekAt(s, now, confirms);
  if (!wk) return null;
  return harvestOf(weekBells(s, wk, now), [...(confirms.get(wk) ?? [])].sort());
}
