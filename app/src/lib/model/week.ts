// Compute-on-read: validated state + "now" → the WeekView the UI renders. Replaces the old server's week + ledger
// + the settlement scheduler (deleted; golden.test.ts pins the behaviour):
//   paid(week, bucket) = max(payout as of Sunday 19:30 JST, payout as of Wednesday 04:00 JST)
// where "as of T" only uses rows the server stamped at ≤ T. That is exactly the old earn + top-up ledger.
import type {
  CheckinTick, DayMetrics, FruitKey, FruitView, HarvestView, JarView, LocalDate, PendingConfirmation, PersonId,
  PersonWeekView, Visit, WeekInput, WeekKey, WeekPayout, WeekScore, WeekView, Workout
} from '#lib/types.ts';
import { CALIBRATION_WEEKS, FRUITS, MONEY, PEOPLE, RUNGS, STRENGTH } from '#lib/config/rules.ts';
import { PLACES } from '#lib/config/places.ts';
import {
  addDays, deriveVisits, isStrengthWorkout, nextRung, nowInZone, payoutWeek, scoreWeek, targetsFor, weekDays, weekKeyOf
} from '#lib/scoring/index.ts';
import { workoutLabel } from './labels.ts';
import type { Snapshot } from './snapshot.ts';
import {
  finalMs, firstWeek, isLockedAt, jstMs, latestAt, partnerOf, provisionalMs, reduce, type State
} from './state.ts';

const LIVE = Infinity;

// ---------- inputs as of T ----------

type VisitRec = Visit & { id: string };

function workoutsAsOf(s: State, person: PersonId, t: number): Workout[] {
  return s.workouts[person]
    .filter((w) => w.at <= t)
    .map((w) => ({
      extId: w.extId, date: w.date, type: w.type, startAt: w.startAt, endAt: w.endAt, durationMin: w.durationMin, avgHr: w.avgHr,
      includesStrength: latestAt(s.workoutConfirms.get(`${person}|${w.extId}`), t) ?? null
    }));
}

function visitsAsOf(s: State, person: PersonId, t: number): VisitRec[] {
  const events = s.presence[person].filter((e) => e.at <= t);
  const idOf = new Map(events.map((e) => [e.n, e.id]));
  const confirmations = new Map<number, boolean>();
  for (const e of events) {
    const c = e.event === 'arrive' ? latestAt(s.visitConfirms.get(e.id), t) : undefined;
    if (c !== undefined) confirmations.set(e.n, c);
  }
  const places = PLACES.filter((p) => p.person === person).map((p) => ({ key: p.key, autoStrength: p.autoStrength }));
  return deriveVisits(events.map((e) => ({ id: e.n, placeKey: e.placeKey, event: e.event, at: e.eventAt })), places, confirmations)
    .map(({ arriveEventId, ...v }) => ({ ...v, id: idOf.get(arriveEventId)! }));
}

/** Current ticks as of T, keyed `date|habit`, in the order the tick was (last) set. */
function ticksAsOf(s: State, person: PersonId, t: number): Map<string, CheckinTick> {
  const on = new Map<string, CheckinTick>();
  for (const c of s.checkins[person]) {
    if (c.at > t) break;
    const k = `${c.date}|${c.habit}`;
    if (c.done) {
      if (!on.has(k)) on.set(k, { date: c.date, habitKey: c.habit });
    } else on.delete(k);
  }
  return on;
}

function metricAsOf(s: State, person: PersonId, date: LocalDate, metric: 'steps' | 'exercise_min', t: number): number | null {
  // Append-only and higher-only: the max of rows ≤ T is the latest value ≤ T (and robust to a hand-edited sheet).
  let best: number | null = null;
  for (const r of s.metrics[person].get(`${date}|${metric}`) ?? []) if (r.at <= t && (best === null || r.v > best)) best = r.v;
  return best;
}

interface Activity { workouts: Workout[]; visits: VisitRec[] }

function activityAsOf(s: State, person: PersonId, t: number): Activity {
  return { workouts: workoutsAsOf(s, person, t), visits: visitsAsOf(s, person, t) };
}

function weekInput(s: State, person: PersonId, wk: WeekKey, t: number, act: Activity = activityAsOf(s, person, t)): WeekInput {
  const dates = weekDays(wk);
  const inWeek = (d: LocalDate) => d >= dates[0] && d <= dates[6];
  const days: DayMetrics[] = dates.map((date) => ({
    date, steps: metricAsOf(s, person, date, 'steps', t), exerciseMin: metricAsOf(s, person, date, 'exercise_min', t)
  }));
  return {
    person, weekKey: wk, age: PEOPLE[person].age, targets: targetsFor(person, wk), days,
    workouts: act.workouts.filter((w) => inWeek(w.date)),
    visits: act.visits.filter((v) => inWeek(v.date)).map(({ id: _id, ...v }) => v),
    checkins: [...ticksAsOf(s, person, t).values()].filter((c) => inWeek(c.date)),
    calibration: CALIBRATION_WEEKS.includes(wk)
  };
}

export function payoutAsOf(s: State, wk: WeekKey, t: number, act?: Record<PersonId, Activity>): { a: WeekScore; b: WeekScore; payout: WeekPayout } {
  const a = scoreWeek(weekInput(s, 'A', wk, t, act?.A));
  const b = scoreWeek(weekInput(s, 'B', wk, t, act?.B));
  return { a, b, payout: payoutWeek(a, b) };
}

// ---------- the ledger as a function ----------

export interface Buckets { A: number; B: number; team: number; purseA: number; purseB: number }
const ZERO: Buckets = { A: 0, B: 0, team: 0, purseA: 0, purseB: 0 };
const buckets = (p: WeekPayout): Buckets => ({ A: p.A.fruitYen, B: p.B.fruitYen, team: p.teamYen, purseA: p.A.purseYen, purseB: p.B.purseYen });
const maxBuckets = (x: Buckets, y: Buckets): Buckets => ({
  A: Math.max(x.A, y.A), B: Math.max(x.B, y.B), team: Math.max(x.team, y.team), purseA: Math.max(x.purseA, y.purseA), purseB: Math.max(x.purseB, y.purseB)
});

export interface SettledWeek { weekKey: WeekKey; provisional: Buckets; final: Buckets | null }

/** Every paid week whose Sunday 19:30 has passed at `now`, with its two payout snapshots. */
export function settledWeeks(s: State, now: number): SettledWeek[] {
  const out: SettledWeek[] = [];
  for (let wk = firstWeek(); provisionalMs(wk) <= now; wk = addDays(wk, 7)) {
    out.push({
      weekKey: wk,
      provisional: buckets(payoutAsOf(s, wk, provisionalMs(wk)).payout),
      final: finalMs(wk) <= now ? buckets(payoutAsOf(s, wk, finalMs(wk)).payout) : null
    });
  }
  return out;
}

/** What a week had paid at time t (earn at Sunday 19:30, top-up at Wednesday 04:00; never clawed back). */
export function paidAt(w: SettledWeek, t: number): Buckets {
  if (t < provisionalMs(w.weekKey)) return ZERO;
  if (t < finalMs(w.weekKey) || !w.final) return w.provisional;
  return maxBuckets(w.provisional, w.final);
}

const jarSum = (b: Buckets) => b.A + b.B + b.team;

export interface PurseState {
  spentYen: number;
  pending: JarView['pendingSpends'];
}

/** Replay spends/approvals in server order: an overdraw is void, ≥ ¥5,000 waits for the partner's OK. */
export function replayPurse(s: State, weeks: SettledWeek[], now: number): PurseState {
  const earnedAt = (t: number) => weeks.reduce((sum, w) => { const b = paidAt(w, t); return sum + b.purseA + b.purseB; }, 0);
  type Live = { rec: State['spends'][number]; done: boolean; pending: boolean };
  const spends = new Map<string, Live>();
  let spent = 0;
  const ops = [
    ...s.spends.map((rec) => ({ at: rec.at, kind: 'spend' as const, rec })),
    ...s.approves.map((rec) => ({ at: rec.at, kind: 'approve' as const, rec }))
  ].filter((o) => o.at <= now).sort((x, y) => x.at - y.at);
  for (const o of ops) {
    if (o.kind === 'spend') {
      if (earnedAt(o.at) - spent < o.rec.amountYen) continue; // insufficient_purse: never recorded
      if (o.rec.amountYen >= MONEY.purseNeedsBothAtYen) spends.set(o.rec.spendId, { rec: o.rec, done: false, pending: true });
      else {
        spent += o.rec.amountYen;
        spends.set(o.rec.spendId, { rec: o.rec, done: true, pending: false });
      }
    } else {
      const sp = spends.get(o.rec.spendId);
      if (!sp || sp.done || sp.rec.person === o.rec.person) continue;
      if (earnedAt(o.at) - spent < sp.rec.amountYen) continue;
      spent += sp.rec.amountYen;
      sp.done = true;
      sp.pending = false;
    }
  }
  return {
    spentYen: spent,
    pending: [...spends.values()].filter((x) => x.pending).map((x) => ({ id: x.rec.rawId, label: x.rec.label, amountYen: x.rec.amountYen, by: x.rec.person }))
  };
}

/** Which week's harvest is open at t, given the confirmations so far (Sunday 19:30 until both tapped). */
function harvestWeekAt(t: number, confirms: Map<WeekKey, Set<PersonId>>): WeekKey | null {
  const cur = weekKeyOf(nowInZone(new Date(t)).date);
  for (const wk of [cur, addDays(cur, -7)]) {
    if (t < provisionalMs(wk) || wk < firstWeek()) continue;
    return (confirms.get(wk)?.size ?? 0) < 2 ? wk : null;
  }
  return null;
}

/** Accepted harvest taps: only for the week that was open at the time of the tap. */
function replayHarvests(s: State, now: number): Map<WeekKey, Set<PersonId>> {
  const confirms = new Map<WeekKey, Set<PersonId>>();
  for (const h of s.harvests) {
    if (h.at > now) break;
    if (harvestWeekAt(h.at, confirms) !== h.week) continue;
    const set = confirms.get(h.week) ?? new Set<PersonId>();
    set.add(h.person);
    confirms.set(h.week, set);
  }
  return confirms;
}

export function prevMonth(date: LocalDate): string {
  const [y, m] = date.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
}

/** Jar yen attributed to a calendar month (by the week's Sunday, i.e. harvest day). */
export function monthEarnings(weeks: SettledWeek[], month: string, now: number): number {
  const first = `${month}-01`;
  const nextFirst = `${addDays(first, 31).slice(0, 7)}-01`;
  const lo = addDays(first, -6);
  const hi = addDays(nextFirst, -6);
  return weeks.filter((w) => w.weekKey >= lo && w.weekKey < hi).reduce((sum, w) => sum + jarSum(paidAt(w, now)), 0);
}

// ---------- view ----------

function fruitView(score: WeekScore, key: FruitKey): FruitView {
  const c = score.categories[key];
  return { milli: c.milli, maxMilli: c.maxMilli, pct: c.maxMilli > 0 ? Math.floor((c.milli * 100) / c.maxMilli) : 0, actual: c.actual, target: c.target };
}

/** One person's card. Both players see everything (no privacy filter): raw numbers and eating check-ins. */
function personView(s: State, person: PersonId, wk: WeekKey, score: WeekScore): PersonWeekView {
  const pref = s.prefs[person];
  const view: PersonWeekView = {
    person,
    villagerName: pref.villagerName ?? PEOPLE[person].villager,
    villager: pref.villager ?? null,
    score: score.score,
    fruits: Object.fromEntries(FRUITS.map((k) => [k, fruitView(score, k)])) as Record<FruitKey, FruitView>,
    lastSyncAt: s.lastSync[person],
    habits: { keys: targetsFor(person, wk).habits, ticksByDate: {} }
  };
  const from = addDays(wk, -2);
  const to = addDays(wk, 6);
  const ticks = [...ticksAsOf(s, person, LIVE).values()]
    .filter((c) => c.date >= from && c.date <= to)
    .sort((x, y) => x.date.localeCompare(y.date) || x.habitKey.localeCompare(y.habitKey));
  for (const c of ticks) (view.habits.ticksByDate[c.date] ??= []).push(c.habitKey);
  return view;
}

/** Gym visits and ask-type workouts waiting for 「筋トレとして記録する?」, in weeks not locked yet. */
function pendingConfirmations(person: PersonId, cur: WeekKey, act: Activity, locale: 'ja' | 'en', now: number): PendingConfirmation[] {
  const out: PendingConfirmation[] = [];
  const names = new Map(PLACES.filter((p) => p.person === person).map((p) => [p.key, p.name]));
  for (const wk of [addDays(cur, -7), cur]) {
    if (isLockedAt(wk, now)) continue;
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
      if ((STRENGTH.askTypes as readonly string[]).includes(w.type) && w.includesStrength === null && w.durationMin >= STRENGTH.minWorkoutMin) {
        out.push({ kind: 'workout', id: w.extId, date: w.date, label: workoutLabel(w.type, locale) });
      }
    }
  }
  return out.sort((x, y) => x.date.localeCompare(y.date));
}

function hostLine(v: Omit<WeekView, 'juniper'>, hour: number, dayOfMonth: number): WeekView['juniper'] {
  const me = v.people[v.me];
  const todayTicks = me.habits?.ticksByDate[v.today]?.length ?? 0;
  if (v.harvest && !v.harvest.confirmedBy.includes(v.me)) return { key: 'juniper.harvest_ready', params: { score: me.score } };
  if (v.harvest) return { key: 'juniper.harvest_waiting', params: { name: v.people[v.partner].villagerName } };
  if (dayOfMonth === MONEY.paydayDayOfMonth && v.jar.transfer && !v.jar.transfer.done) return { key: 'juniper.payday', params: { yen: v.jar.transfer.amountYen } };
  if (v.pending.length > 0) return { key: 'juniper.pending_confirm', params: { label: v.pending[0].label } };
  if (todayTicks > 0 && hour >= 17) return { key: 'juniper.checkin_done' };
  if (hour >= 18) return { key: 'juniper.evening' };
  if (hour < 11) return { key: 'juniper.morning', params: { name: me.villagerName } };
  if (v.jar.nextRung) return { key: 'juniper.next_rung', params: { rung: v.jar.nextRung.key, yen: v.jar.nextRung.remainingYen } };
  return { key: 'juniper.default', params: { score: me.score } };
}

const toMs = (t: Date | string | number): number => (t instanceof Date ? t.getTime() : typeof t === 'number' ? t : Date.parse(t));

/**
 * The WeekView for `me` at `now`, from a snapshot (or an already-reduced state). Rows stamped after `now` still count
 * for live scores (the server clock may run ahead of the phone); `now` decides which settlement cutoffs have passed.
 */
export function buildWeekView(input: Snapshot | State, me: PersonId, nowArg: Date | string | number): WeekView {
  const s = 'rows' in input ? reduce(input) : input;
  const now = toMs(nowArg);
  const z = nowInZone(new Date(now));
  const today = z.date;
  const weekKey = weekKeyOf(today);
  const partner = partnerOf(me);
  const act = { A: activityAsOf(s, 'A', LIVE), B: activityAsOf(s, 'B', LIVE) };
  const current = payoutAsOf(s, weekKey, LIVE, act);
  const scores: Record<PersonId, WeekScore> = { A: current.a, B: current.b };
  const locale = s.prefs[me].locale ?? 'ja';

  const weeks = settledWeeks(s, now);
  const paid = weeks.map((w) => ({ w, b: paidAt(w, now) }));
  const layers = paid.reduce((acc, { b }) => ({ A: acc.A + b.A, B: acc.B + b.B, team: acc.team + b.team }), { A: 0, B: 0, team: 0 });
  const earnedPurse = paid.reduce((sum, { b }) => sum + b.purseA + b.purseB, 0);
  const purse = replayPurse(s, weeks, now);
  const totalYen = layers.A + layers.B + layers.team;
  const month = prevMonth(today);
  const amountYen = monthEarnings(weeks, month, now);
  const done = s.transfers.some((x) => x.month === month && x.at <= now);
  const jar: JarView = {
    totalYen,
    layers,
    purseYen: earnedPurse - purse.spentYen,
    thisWeekEstimateYen: current.payout.A.fruitYen + current.payout.B.fruitYen + current.payout.teamYen,
    nextRung: nextRung(totalYen),
    rungs: RUNGS.map((r) => ({ key: r.key, yen: r.yen, reached: totalYen >= r.yen })),
    transfer: amountYen > 0 || done ? { month, amountYen, done } : null,
    pendingSpends: purse.pending,
    weeks: weeks.length
  };

  const confirms = replayHarvests(s, now);
  const hwk = harvestWeekAt(now, confirms);
  let harvest: HarvestView | null = null;
  if (hwk) {
    const payout = hwk === weekKey ? current.payout : payoutAsOf(s, hwk, LIVE, act).payout;
    const before = paid.filter(({ w }) => w.weekKey < hwk).reduce((sum, { b }) => sum + jarSum(b), 0);
    const after = paid.filter(({ w }) => w.weekKey <= hwk).reduce((sum, { b }) => sum + jarSum(b), 0);
    harvest = {
      weekKey: hwk,
      payout,
      rungsReached: RUNGS.filter((r) => before < r.yen && after >= r.yen).map((r) => r.key),
      confirmedBy: [...(confirms.get(hwk) ?? [])].sort()
    };
  }

  const startOfToday = jstMs(today, 0, 0);
  const base: Omit<WeekView, 'juniper'> = {
    me,
    partner,
    locale,
    weekKey,
    today,
    people: {
      [me]: personView(s, me, weekKey, scores[me]),
      [partner]: personView(s, partner, weekKey, scores[partner])
    } as Record<PersonId, PersonWeekView>,
    jar,
    harvest,
    pending: pendingConfirmations(me, weekKey, act[me], locale, now),
    highFivesToday: s.highfives.filter((h) => h.person === partner && h.at >= startOfToday && h.at <= now).length
  };
  return { ...base, juniper: hostLine(base, z.hour, Number(today.slice(8, 10))) };
}
