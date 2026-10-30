// Compute-on-read: validated state + "now" → the WeekView the UI renders. Replaces the old server's week + ledger
// + the settlement scheduler (deleted; golden.test.ts pins the behaviour):
//   paid(week, bucket) = max(payout as of Sunday 19:30 JST, payout as of Wednesday 04:00 JST)
// where "as of T" only uses rows the server stamped at ≤ T. That is exactly the old earn + top-up ledger.
// The ベル economy (ADR 0019) lives in bells.ts; the old yen ledger below stays until the UI has moved over.
import type {
  CategoryResult, DayMetrics, FruitKey, FruitProgress, FruitView, HarvestView, JarView, LocalDate, MenuItem, PendingConfirmation, PersonId,
  PersonWeekView, PotKey, PotsView, WeekInput, WeekKey, WeekPayout, WeekScore, WeekView
} from '#lib/types.ts';
import { DAILY, DEFAULT_MENUS, FRUITS, MONEY, PEOPLE, RUNGS, STRENGTH } from '#lib/config/rules.ts';
import { rulesFor } from '#lib/scoring/targets.ts';
import { zeroParts, type WeekEarning } from '#lib/scoring/bells.ts';
import { dailyUpTo, potsAt, weekBells, type WeekBells } from './bells.ts';
import { PLACES } from '#lib/config/places.ts';
import {
  addDays, isStrengthWorkout, nextRung, nowInZone, payoutWeek, scoreWeek, targetsFor, weekDays, weekKeyOf
} from '#lib/scoring/index.ts';
import { workoutLabel } from '#lib/contract/labels.ts';
import type { Snapshot } from './snapshot.ts';
import {
  finalMs, firstWeek, isLockedAt, jstMs, latestAt, partnerOf, provisionalMs, reduce, rowsUpTo, type State
} from './state.ts';
import { activityAsOf, metricAsOf, ticksAsOf, weekDates, type Activity } from './inputs.ts';

const LIVE = Infinity;

export { activityAsOf, metricAsOf, ticksAsOf, weekDates, workoutsAsOf, type Activity, type Dates } from './inputs.ts';

export function weekInput(s: State, person: PersonId, wk: WeekKey, t: number, act: Activity = activityAsOf(s, person, t, weekDates(wk))): WeekInput {
  const dates = weekDays(wk);
  const inWeek = (d: LocalDate) => d >= dates[0] && d <= dates[6];
  const days: DayMetrics[] = dates.map((date) => ({
    date, steps: metricAsOf(s, person, date, 'steps', t), exerciseMin: metricAsOf(s, person, date, 'exercise_min', t)
  }));
  return {
    person, weekKey: wk, age: PEOPLE[person].age, targets: targetsFor(person, wk), days,
    workouts: act.workouts.filter((w) => inWeek(w.date)),
    visits: act.visits.filter((v) => inWeek(v.date)).map(({ id: _id, ...v }) => v),
    checkins: [...ticksAsOf(s, person, t, weekDates(wk)).values()]
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
export const buckets = (p: WeekPayout): Buckets => ({ A: p.A.fruitYen, B: p.B.fruitYen, team: p.teamYen, purseA: p.A.purseYen, purseB: p.B.purseYen });
export const maxBuckets = (x: Buckets, y: Buckets): Buckets => ({
  A: Math.max(x.A, y.A), B: Math.max(x.B, y.B), team: Math.max(x.team, y.team), purseA: Math.max(x.purseA, y.purseA), purseB: Math.max(x.purseB, y.purseB)
});

export interface SettledWeek { weekKey: WeekKey; provisional: Buckets; final: Buckets | null }

/** Per State: each week's payout as of its two cutoffs. They depend only on rows stamped by then, never on `now`. */
const snapshots = new WeakMap<State, Map<WeekKey, { provisional?: Buckets; final?: Buckets }>>();
/**
 * Across States (round 8 P5): a cutoff's payout keyed by week, cutoff and the number of rows stamped by then, valid
 * for one `rev`. Rows are append-only with increasing `at` while `rev` holds, so the count pins the exact rows.
 */
const pastPayouts = { rev: '', byKey: new Map<string, Buckets>() };
function payoutAtCutoff(s: State, wk: WeekKey, t: number): Buckets {
  if (s.rev === null) return buckets(payoutAsOf(s, wk, t).payout);
  if (pastPayouts.rev !== s.rev) {
    pastPayouts.byKey.clear();
    pastPayouts.rev = s.rev;
  }
  const key = `${wk}|${t}|${rowsUpTo(s, t)}`;
  let b = pastPayouts.byKey.get(key);
  if (!b) pastPayouts.byKey.set(key, (b = Object.freeze(buckets(payoutAsOf(s, wk, t).payout))));
  return b;
}

/** A paid week whose Sunday 19:30 has passed at `now`, with its two payout snapshots; null otherwise. */
export function settleWeek(s: State, wk: WeekKey, now: number): SettledWeek | null {
  if (wk < firstWeek(s) || provisionalMs(wk) > now) return null;
  let byWeek = snapshots.get(s);
  if (!byWeek) snapshots.set(s, (byWeek = new Map()));
  let x = byWeek.get(wk);
  if (!x) byWeek.set(wk, (x = {}));
  x.provisional ??= payoutAtCutoff(s, wk, provisionalMs(wk));
  if (finalMs(wk) > now) return { weekKey: wk, provisional: x.provisional, final: null };
  x.final ??= payoutAtCutoff(s, wk, finalMs(wk));
  return { weekKey: wk, provisional: x.provisional, final: x.final };
}

/** Every paid week whose Sunday 19:30 has passed at `now`, with its two payout snapshots. */
export function settledWeeks(s: State, now: number): SettledWeek[] {
  const out: SettledWeek[] = [];
  for (let wk = firstWeek(s); provisionalMs(wk) <= now; wk = addDays(wk, 7)) out.push(settleWeek(s, wk, now)!);
  return out;
}

/** What a week had paid at time t (earn at Sunday 19:30, top-up at Wednesday 04:00; never clawed back). */
export function paidAt(w: SettledWeek, t: number): Buckets {
  if (t < provisionalMs(w.weekKey)) return ZERO;
  if (t < finalMs(w.weekKey) || !w.final) return w.provisional;
  return maxBuckets(w.provisional, w.final);
}

export const jarSum = (b: Buckets): number => b.A + b.B + b.team;
export const purseSum = (b: Buckets): number => b.purseA + b.purseB;
const addBuckets = (x: Buckets, y: Buckets): Buckets => ({
  A: x.A + y.A, B: x.B + y.B, team: x.team + y.team, purseA: x.purseA + y.purseA, purseB: x.purseB + y.purseB
});

type SpendStatus = 'done' | 'waiting' | 'refused' | 'voided';

export interface SpendLog {
  spendId: string;
  id: number | string;
  at: number;
  by: PersonId;
  label: string;
  amountYen: number;
  status: SpendStatus;
  /** When it was paid (at once, or at the partner's OK). */
  doneAt: number | null;
  voidedAt: number | null;
  /** It had been paid when voided: the purse got it back. */
  refunded: boolean;
}

export interface PurseState {
  spentYen: number;
  pending: JarView['pendingSpends'];
  /** Every spend in server order with its outcome (きろく → お金). */
  log: SpendLog[];
}

/**
 * Replay spends/approvals/voids in server order: an overdraw is refused (never recorded), ≥ ¥5,000 waits for the
 * partner's OK, and the spender's void refunds a paid spend or cancels a waiting one (refusals stay refusals).
 */
export function replayPurse(s: State, weeks: SettledWeek[], now: number): PurseState {
  const earnedAt = (t: number) => weeks.reduce((sum, w) => sum + purseSum(paidAt(w, t)), 0);
  type Live = { rec: State['spends'][number]; log: SpendLog };
  const spends = new Map<string, Live>();
  const log: SpendLog[] = [];
  let spent = 0;
  const ops = [
    ...s.spends.map((rec) => ({ at: rec.at, kind: 'spend' as const, rec })),
    ...s.approves.map((rec) => ({ at: rec.at, kind: 'approve' as const, rec })),
    ...s.spendVoids.map((rec) => ({ at: rec.at, kind: 'void' as const, rec }))
  ].filter((o) => o.at <= now).sort((x, y) => x.at - y.at);
  for (const o of ops) {
    if (o.kind === 'spend') {
      const entry: SpendLog = {
        spendId: o.rec.spendId, id: o.rec.rawId, at: o.at, by: o.rec.person, label: o.rec.label, amountYen: o.rec.amountYen,
        status: 'refused', doneAt: null, voidedAt: null, refunded: false
      };
      log.push(entry);
      if (earnedAt(o.at) - spent < o.rec.amountYen) continue; // insufficient_purse: never recorded
      if (o.rec.amountYen >= MONEY.purseNeedsBothAtYen) entry.status = 'waiting';
      else {
        spent += o.rec.amountYen;
        entry.status = 'done';
        entry.doneAt = o.at;
      }
      spends.set(o.rec.spendId, { rec: o.rec, log: entry });
    } else if (o.kind === 'approve') {
      const sp = spends.get(o.rec.spendId);
      if (!sp || sp.log.status !== 'waiting' || sp.rec.person === o.rec.person) continue;
      if (earnedAt(o.at) - spent < sp.rec.amountYen) continue;
      spent += sp.rec.amountYen;
      sp.log.status = 'done';
      sp.log.doneAt = o.at;
    } else {
      const sp = spends.get(o.rec.spendId);
      if (!sp || (sp.log.status !== 'done' && sp.log.status !== 'waiting')) continue;
      if (sp.log.status === 'done') {
        spent -= sp.rec.amountYen;
        sp.log.refunded = true;
      }
      sp.log.status = 'voided';
      sp.log.voidedAt = o.at;
    }
  }
  return {
    spentYen: spent,
    pending: [...spends.values()].filter((x) => x.log.status === 'waiting').map((x) => ({ id: x.rec.rawId, label: x.rec.label, amountYen: x.rec.amountYen, by: x.rec.person })),
    log
  };
}

/** A month's transfer ✓ as of t: the latest of its `transfer` / `transfer_undo` rows wins. */
export function transferDoneAt(s: State, month: string, t: number): { done: boolean; at: number | null } {
  let best: { done: boolean; at: number | null } = { done: false, at: null };
  for (const x of s.transfers) if (x.month === month && x.at <= t && (best.at === null || x.at >= best.at)) best = { done: true, at: x.at };
  for (const x of s.transferUndos) if (x.month === month && x.at <= t && best.at !== null && x.at > best.at) best = { done: false, at: x.at };
  return best;
}

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

export function prevMonth(date: LocalDate): string {
  const [y, m] = date.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
}

/** The calendar month a week's jar yen belongs to: its Sunday's (harvest day). */
export const monthOfWeek = (wk: WeekKey): string => addDays(wk, 6).slice(0, 7);

// ---------- view ----------

/** A fruit's fill, 0–100 of its maximum. */
export const pctOf = (c: CategoryResult): number => (c.maxMilli > 0 ? Math.floor((c.milli * 100) / c.maxMilli) : 0);

function fruitView(score: WeekScore, e: WeekEarning, key: FruitKey, today: LocalDate): FruitView & FruitProgress {
  const c = score.categories[key];
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
  return {
    todayActual, todayGoal, todayMet, weekDays: f.weekDays, weekGoalDays: f.weekGoalDays, badge: f.badge, weekBells,
    milli: c.milli, maxMilli: c.maxMilli, pct: pctOf(c), actual: c.actual, target: c.target
  };
}

/** The shared menus at t: the latest valid `pref` by either person, else the defaults in the viewer's language. */
export function menusAt(s: State, locale: 'ja' | 'en', t: number = LIVE): Record<PotKey, MenuItem[]> {
  const pick = (pot: PotKey): MenuItem[] =>
    latestAt(s.menus[pot], t)?.map((x) => ({ ...x })) ?? DEFAULT_MENUS[pot].map((x) => ({ id: x.id, label: x.label[locale], bells: x.bells }));
  return { treat: pick('treat'), trip: pick('trip') };
}

/** A person's earnings of `today` (zeros outside the week or before the economy). */
function todayOf(e: WeekEarning | undefined, today: LocalDate): PersonWeekView['today'] {
  const d = e?.days.find((x) => x.date === today);
  return d ? { bells: d.bells, parts: { ...d.parts } } : { bells: 0, parts: zeroParts() };
}

/** One person's card. Both players see everything (no privacy filter): raw numbers and eating check-ins. */
function personView(s: State, person: PersonId, wk: WeekKey, score: WeekScore, e: WeekEarning, today: LocalDate): PersonWeekView {
  const pref = s.prefs[person];
  const view: PersonWeekView = {
    person,
    villagerName: pref.villagerName ?? PEOPLE[person].villager,
    villager: pref.villager ?? null,
    today: todayOf(e, today),
    weekBells: dailyUpTo(e, today),
    score: score.score,
    fruits: Object.fromEntries(FRUITS.map((k) => [k, fruitView(score, e, k, today)])) as PersonWeekView['fruits'],
    lastSyncAt: s.lastSync[person],
    habits: { keys: targetsFor(person, wk).habits, ticksByDate: {} }
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
  if (v.harvest && !v.harvest.confirmedBy.includes(v.me)) return { key: 'host.harvest_ready', params: { bells: v.harvest.totalBells, score: me.score } };
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
 * for live scores (the server clock may run ahead of the phone); `now` decides which settlement cutoffs have passed.
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
  const current = payoutAsOf(s, weekKey, LIVE, act);
  const scores: Record<PersonId, WeekScore> = { A: current.a, B: current.b };
  const locale = s.prefs[me].locale ?? 'ja';
  const paid = settledWeeks(s, now).map((w) => ({ w, b: paidAt(w, now) }));
  const livePayout = (wk: WeekKey) => (wk === weekKey ? current.payout : payoutAsOf(s, wk, LIVE, act).payout);

  const startOfToday = jstMs(today, 0, 0);
  const earning = weekBells(s, weekKey, now, act);
  const base: Omit<WeekView, 'host'> = {
    me,
    partner,
    locale,
    weekKey,
    today,
    people: {
      [me]: personView(s, me, weekKey, scores[me], earning[me], today),
      [partner]: personView(s, partner, weekKey, scores[partner], earning[partner], today)
    } as Record<PersonId, PersonWeekView>,
    pots: potsView(s, earning, today, now),
    menus: menusAt(s, locale),
    jar: jarView(s, paid, current.payout, today, now),
    harvest: harvestView(s, paid, livePayout, now, act),
    pending: pendingConfirmations(s, me, weekKey, act[me], locale, now),
    highFivesToday: s.highfives.filter((h) => h.person === partner && h.at >= startOfToday && h.at <= now).length
  };
  return { ...base, host: hostLine(base, z.hour) };
}

type Paid = { w: SettledWeek; b: Buckets }[];

/** The pots at `now`, and what both people earned today and this week (the bonus once it landed). */
function potsView(s: State, cur: WeekBells, today: LocalDate, now: number): PotsView {
  const { pots } = potsAt(s, now);
  const daily = dailyUpTo(cur.A, today) + dailyUpTo(cur.B, today);
  return {
    treat: { ...pots.treat },
    trip: { ...pots.trip },
    todayBells: todayOf(cur.A, today).bells + todayOf(cur.B, today).bells,
    weekBells: daily + (provisionalMs(cur.weekKey) <= now ? cur.bonusBells : 0)
  };
}

/** The jar, purse and payday cue at `now`, from what each week has paid so far. */
function jarView(s: State, paid: Paid, current: WeekPayout, today: LocalDate, now: number): JarView {
  const sum = paid.reduce((acc, { b }) => addBuckets(acc, b), ZERO);
  const totalYen = jarSum(sum);
  const purse = replayPurse(s, paid.map(({ w }) => w), now);
  const month = prevMonth(today);
  const amountYen = paid.filter(({ w }) => monthOfWeek(w.weekKey) === month).reduce((acc, { b }) => acc + jarSum(b), 0);
  const done = transferDoneAt(s, month, now).done;
  return {
    totalYen,
    layers: { A: sum.A, B: sum.B, team: sum.team },
    purseYen: purseSum(sum) - purse.spentYen,
    thisWeekEstimateYen: current.A.fruitYen + current.B.fruitYen + current.teamYen,
    nextRung: nextRung(totalYen),
    rungs: RUNGS.map((r) => ({ key: r.key, yen: r.yen, reached: totalYen >= r.yen })),
    transfer: amountYen > 0 || done ? { month, amountYen, done } : null,
    pendingSpends: purse.pending,
    weeks: paid.length
  };
}

/** The open harvest at `now` (Sunday 19:30 until both tapped), with the rungs it reaches. */
function harvestView(s: State, paid: Paid, livePayout: (wk: WeekKey) => WeekPayout, now: number, act: Record<PersonId, Activity>): HarvestView | null {
  const confirms = replayHarvests(s, now);
  const wk = harvestWeekAt(s, now, confirms);
  if (!wk) return null;
  const e = weekBells(s, wk, now, act);
  const before = paid.filter(({ w }) => w.weekKey < wk).reduce((acc, { b }) => acc + jarSum(b), 0);
  const after = paid.filter(({ w }) => w.weekKey <= wk).reduce((acc, { b }) => acc + jarSum(b), 0);
  return {
    weekKey: wk,
    bonus: { ...e.bonus },
    totalBells: e.A.daily + e.B.daily + e.bonusBells,
    payout: livePayout(wk),
    rungsReached: RUNGS.filter((r) => before < r.yen && after >= r.yen).map((r) => r.key),
    confirmedBy: [...(confirms.get(wk) ?? [])].sort()
  };
}
