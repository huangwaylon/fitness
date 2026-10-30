// Compute-on-read: validated state + "now" → the WeekView the UI renders (the island, the pots, the harvest). The
// ベル economy itself (earnings, pots, spends, the ledger) lives in bells.ts; golden.test.ts pins the views.
import type {
  FruitKey, FruitProgress, HarvestView, LocalDate, MenuItem, PendingConfirmation, PersonId, PersonWeekView, PotFlow, PotKey, PotsView, WeekKey, WeekView
} from '#lib/types.ts';
import { DAILY, DEFAULT_MENUS, FRUITS, PEOPLE, STRENGTH } from '#lib/config/rules.ts';
import { habitsFor, rulesFor } from '#lib/scoring/targets.ts';
import { splitPots, zeroParts, type WeekEarning } from '#lib/scoring/bells.ts';
import { dailyUpTo, potsAt, weekBells, type WeekBells } from './bells.ts';
import { PLACES } from '#lib/config/places.ts';
import { addDays, isStrengthWorkout, nowInZone, weekKeyOf } from '#lib/scoring/index.ts';
import { workoutLabel } from '#lib/contract/labels.ts';
import type { Snapshot } from './snapshot.ts';
import { firstWeek, isLockedAt, jstMs, latestAt, partnerOf, provisionalMs, reduce, type State } from './state.ts';
import { activityAsOf, ticksAsOf, type Activity } from './inputs.ts';

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

function fruitView(e: WeekEarning, key: FruitKey, today: LocalDate): FruitProgress {
  const r = rulesFor(e.weekKey);
  const d = e.days.find((x) => x.date === today);
  const f = e.fruits[key];
  const progress: Record<FruitKey, [actual: number, goal: number, met: boolean]> = {
    peach: [d?.minutes ?? 0, r.goals.activeMin, d?.activeMet ?? false],
    apple: [d?.steps ?? 0, r.goals.steps, d?.stepMet ?? false],
    coconut: [d?.strength ? 1 : 0, 1, d?.strength ?? false],
    pear: [d?.ticks ?? 0, DAILY.maxTicks, (d?.ticks ?? 0) >= DAILY.maxTicks]
  };
  const [todayActual, todayGoal, todayMet] = progress[key];
  const weekBells = e.days.reduce((n, x) => (x.date <= today ? n + x.parts[key] : n), 0);
  return { todayActual, todayGoal, todayMet, weekDays: f.weekDays, weekGoalDays: f.weekGoalDays, badge: f.badge, weekBells };
}

/** The shared menus: the latest valid `pref` by either person, else the defaults in the viewer's language. */
function menusAt(s: State, locale: 'ja' | 'en'): Record<PotKey, MenuItem[]> {
  const pick = (pot: PotKey): MenuItem[] =>
    latestAt(s.menus[pot], LIVE)?.map((x) => ({ ...x })) ?? DEFAULT_MENUS[pot].map((x) => ({ id: x.id, label: x.label[locale], bells: x.bells }));
  return { treat: pick('treat'), trip: pick('trip') };
}

/** A person's earnings of `today` (zeros outside the week or before the economy). */
function todayOf(e: WeekEarning | undefined, today: LocalDate): PersonWeekView['today'] {
  const d = e?.days.find((x) => x.date === today);
  return d ? { bells: d.bells, parts: { ...d.parts } } : { bells: 0, parts: zeroParts() };
}

/** One person's card. Both players see everything (no privacy filter): raw numbers and eating check-ins. */
function personView(s: State, person: PersonId, wk: WeekKey, e: WeekEarning, today: LocalDate): PersonWeekView {
  const pref = s.prefs[person];
  const view: PersonWeekView = {
    person,
    villagerName: pref.villagerName ?? PEOPLE[person].villager,
    villager: pref.villager ?? null,
    today: todayOf(e, today),
    weekBells: dailyUpTo(e, today),
    fruits: Object.fromEntries(FRUITS.map((k) => [k, fruitView(e, k, today)])) as PersonWeekView['fruits'],
    lastSyncAt: s.lastSync[person],
    habits: { keys: [...habitsFor(person, wk)] as [string, string, string], ticksByDate: {} }
  };
  const ticks = [...ticksAsOf(s, person, LIVE, { from: addDays(wk, -2), to: addDays(wk, 6) }).values()]
    .sort((x, y) => x.date.localeCompare(y.date) || x.habit.localeCompare(y.habit));
  for (const c of ticks) (view.habits.ticksByDate[c.date] ??= []).push(c.habit);
  return view;
}

/** Gym visits and ask-type workouts waiting for 「筋トレとして記録する?」, in weeks not locked yet. */
function pendingConfirmations(s: State, person: PersonId, cur: WeekKey, act: Activity, locale: 'ja' | 'en', now: number): PendingConfirmation[] {
  const out: PendingConfirmation[] = [];
  const names = new Map(PLACES.filter((p) => p.person === person).map((p) => [p.key, p.name]));
  for (const wk of [addDays(cur, -7), cur]) {
    if (isLockedAt(s, wk, now)) continue;
    const end = addDays(wk, 6);
    const inWeek = (d: LocalDate) => d >= wk && d <= end;
    const workouts = act.workouts.filter((w) => inWeek(w.date)).sort((x, y) => x.date.localeCompare(y.date));
    for (const v of act.visits.filter((x) => inWeek(x.date))) {
      if (v.autoStrength || v.confirmed !== null) continue;
      const a = Date.parse(v.arriveAt);
      const l = Date.parse(v.leaveAt);
      if (workouts.some((w) => isStrengthWorkout(w) && Date.parse(w.startAt) < l && Date.parse(w.endAt) > a)) continue;
      out.push({ kind: 'visit', id: v.id, date: v.date, label: names.get(v.placeKey) ?? v.placeKey });
    }
    for (const w of workouts) {
      if ((STRENGTH.askTypes as readonly string[]).includes(w.type) && w.includesStrength === null && w.strengthOverride === undefined && w.durationMin >= STRENGTH.minWorkoutMin) {
        out.push({ kind: 'workout', id: w.id, date: w.date, label: workoutLabel(w.type, locale) });
      }
    }
  }
  return out.sort((x, y) => x.date.localeCompare(y.date));
}

function hostLine(v: Omit<WeekView, 'host'>, hour: number): WeekView['host'] {
  const me = v.people[v.me];
  const todayTicks = me.habits?.ticksByDate[v.today]?.length ?? 0;
  if (v.harvest && !v.harvest.confirmedBy.includes(v.me)) return { key: 'host.harvest_ready', params: { bells: v.harvest.totalBells } };
  if (v.harvest) return { key: 'host.harvest_waiting', params: { name: v.people[v.partner].villagerName } };
  if (v.pending.length > 0) return { key: 'host.pending_confirm', params: { label: v.pending[0].label } };
  if (todayTicks > 0 && hour >= 17) return { key: 'host.checkin_done' };
  if (hour >= 18) return { key: 'host.evening' };
  if (hour < 11) return { key: 'host.morning', params: { name: me.villagerName } };
  return { key: 'host.default', params: { bells: me.today.bells } };
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
      [me]: personView(s, me, weekKey, earning[me], today),
      [partner]: personView(s, partner, weekKey, earning[partner], today)
    } as Record<PersonId, PersonWeekView>,
    pots: potsView(s, earning, today, now),
    menus: menusAt(s, locale),
    harvest: harvestView(s, now, act),
    pending: pendingConfirmations(s, me, weekKey, act[me], locale, now),
    highFivesToday: s.highfives.filter((h) => h.person === partner && h.at >= startOfToday && h.at <= now).length
  };
  return { ...base, host: hostLine(base, z.hour) };
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
    badges: { A: { ...w.A.badges }, B: { ...w.B.badges } },
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
