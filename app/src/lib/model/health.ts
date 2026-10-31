// けんこう (docs/design.md#kenkou, decisions.md "Health trends"): the Health data over time, one person at a time, as the
// personal trainer reads it. Pure and computed on read from the reduced State; nothing here feeds the ベル economy.
//
// Rules:
// - A day's value is Apple Health's latest row (metricAsOf at `now`), the truth for a trainer. (The ベル of a locked
//   week stay as of its lock, so a sync after a lock can show here and not in the ledger.)
// - No record: a day with no row; for steps, under STEPS_MIN (the phone wasn't carried); for Move, Exercise and Stand
//   together, a day the Watch wasn't clearly worn (Move under WORN_KCAL and Stand under WORN_STAND). Such a day has no
//   bar (a hatched mark instead) and stays out of every average, best day, goal count and trend, and is counted as 記録なし.
// - Today is still running: it is drawn (a lighter bar, whenever it has anything above 0) but stays out of the stats
//   and the 7-day line.
// - A goal is met as on the stamp card: kcal ≥ that day's Move goal, exercise ≥ 60, whole Stand minutes ≥ 120, steps ≥
//   8,000. Days met / days recorded.
// - Periods end on an anchor day (today until ‹): 1週 = 7 days and 1か月 = 30 days by day, 3か月 = 13 weeks by week
//   (ending on the anchor), 1年 = 12 calendar months by month, すべて = every month since the first record. The
//   previous period is the same length just before (1年: the 12 months before).
import type { LocalDate, PersonId, RingFruit } from '#lib/types.ts';
import { RULES } from '#lib/config/rules.ts';
import { addDays, daysBetween, localDateAt } from '#lib/time/dates.ts';
import type { ActivityMetric } from '#lib/contract/api.ts';
import { moveGoalOn, type State } from './state.ts';
import { metricAsOf } from './inputs.ts';
import { weightTrend, type WeightTrend } from './weight.ts';

/** The four metrics in the app's order (🍐 Move, 🍑 Exercise, 🍒 Stand, 🍎 Steps). */
export const METRICS = ['move', 'exercise', 'stand', 'steps'] as const;
export type Metric = (typeof METRICS)[number];
export const METRIC_FRUIT: Record<Metric, RingFruit> = { move: 'pear', exercise: 'peach', stand: 'cherry', steps: 'apple' };
const ROW: Record<Metric, ActivityMetric> = { move: 'move_kcal', exercise: 'exercise_min', stand: 'stand_min', steps: 'steps' };

export const PERIODS = ['week', 'month', 'quarter', 'year', 'all'] as const;
export type Period = (typeof PERIODS)[number];
/** Day-based periods: their length in days (1年 and すべて go by calendar month). */
const DAYS: Partial<Record<Period, number>> = { week: 7, month: 30, quarter: 91 };
/** A finished day counts for Move, Exercise and Stand only when the Watch was clearly worn: this much Move or… */
export const WORN_KCAL = 100;
/** …this many Stand minutes. Under both: a Watch on its charger, or on for minutes, not a lazy day. */
export const WORN_STAND = 30;
/** A finished day counts for steps only from this many (fewer: the phone stayed home). */
export const STEPS_MIN = 500;
/** The 7-day line needs this many recorded days in its window. */
const ROLL_MIN = 3;

/** One person's days, index i = `from` + i days. null = no record. */
interface PersonSeries {
  values: Record<Metric, (number | null)[]>;
  /** The Move goal in force each day (the other goals are fixed). */
  moveGoal: number[];
  /** That day's weigh-in (kg) and the weight trend carried to that day (null before the first weigh-in). */
  kg: (number | null)[];
  trend: (number | null)[];
  /** The weight goal (shown only) and, at today's pace, when the trend may reach it. */
  goalWeight: number | null;
  projection: WeightTrend['projection'];
}

export interface HealthSeries {
  /** The first day with any Health row of either person (today without any). */
  from: LocalDate;
  /** The first day with an activity row of either person (weight can start earlier): days before it aren't 記録なし. */
  activityFrom: LocalDate;
  /** Today. */
  to: LocalDate;
  /** Whether anyone has any record yet. */
  any: boolean;
  people: Record<PersonId, PersonSeries>;
}

const memo = new WeakMap<State, Map<LocalDate, HealthSeries>>();

/** Both people's daily series from the first record to today. Memoised per State and day (a State is never mutated). */
export function healthSeries(s: State, now: number): HealthSeries {
  const to = localDateAt(now);
  let byDay = memo.get(s);
  if (!byDay) memo.set(s, (byDay = new Map()));
  let hit = byDay.get(to);
  if (!hit) byDay.set(to, (hit = buildSeries(s, to, now)));
  return hit;
}

function buildSeries(s: State, to: LocalDate, now: number): HealthSeries {
  let activityFrom = to;
  for (const p of ['A', 'B'] as PersonId[]) for (const d of s.metrics[p].keys()) if (d < activityFrom) activityFrom = d;
  let from = activityFrom;
  for (const p of ['A', 'B'] as PersonId[]) for (const d of s.weights[p].keys()) if (d < from) from = d;
  const any = from < to || (['A', 'B'] as PersonId[]).some((p) => s.metrics[p].has(to) || s.weights[p].has(to));
  const n = daysBetween(from, to) + 1;
  const person = (p: PersonId): PersonSeries => {
    const values = { move: [], exercise: [], stand: [], steps: [] } as Record<Metric, (number | null)[]>;
    const moveGoal: number[] = [];
    const w = weightTrend(s, p, now);
    const kgBy = new Map(w.points.map((x) => [x.date, x] as const));
    const kg: (number | null)[] = [];
    const trend: (number | null)[] = [];
    let carried: number | null = null;
    for (let i = 0, d = from; i < n; i++, d = addDays(d, 1)) {
      const raw = (m: Metric) => metricAsOf(s, p, d, ROW[m], now);
      // today (still running, drawn but never counted) shows anything above 0
      const live = d === to;
      const steps = raw('steps');
      values.steps.push(steps === null || steps < (live ? 1 : STEPS_MIN) ? null : steps);
      const watch = [raw('move'), raw('exercise'), raw('stand')];
      const worn = live ? watch.some((v) => v !== null && v > 0) : (watch[0] ?? 0) >= WORN_KCAL || (watch[2] ?? 0) >= WORN_STAND;
      values.move.push(worn ? watch[0] : null);
      values.exercise.push(worn ? watch[1] : null);
      values.stand.push(worn ? watch[2] : null);
      moveGoal.push(moveGoalOn(s, p, d));
      const wi = kgBy.get(d);
      if (wi) carried = wi.trend;
      kg.push(wi?.kg ?? null);
      trend.push(carried);
    }
    return { values, moveGoal, kg, trend, goalWeight: w.goal, projection: w.projection };
  };
  return { from, to, activityFrom, any, people: { A: person('A'), B: person('B') } };
}

/** A metric's goal on day i. */
const goalOf = (ps: PersonSeries, m: Metric, i: number): number =>
  m === 'move' ? ps.moveGoal[i] : m === 'exercise' ? RULES.goals.exerciseMin : m === 'stand' ? RULES.goals.standMin : RULES.goals.steps;

/** The stamp card's rule (scoring/bells.ts earnWeek). */
function metGoal(m: Metric, v: number, goal: number): boolean {
  return m === 'stand' ? Math.floor(v) >= goal : v >= goal;
}

// ---------- ranges ----------

interface Bucket {
  from: LocalDate;
  to: LocalDate;
}
export interface Range {
  period: Period;
  from: LocalDate;
  to: LocalDate;
  /** Days, weeks or months, ascending, covering from..to. */
  unit: 'day' | 'week' | 'month';
  buckets: Bucket[];
}

const monthStart = (d: LocalDate): LocalDate => `${d.slice(0, 8)}01`;
/** The first day of the month `k` months from d's. */
function addMonths(d: LocalDate, k: number): LocalDate {
  const y = Number(d.slice(0, 4)), m = Number(d.slice(5, 7)) - 1 + k;
  const yy = y + Math.floor(m / 12), mm = ((m % 12) + 12) % 12;
  return `${yy}-${String(mm + 1).padStart(2, '0')}-01`;
}
const monthEnd = (d: LocalDate): LocalDate => addDays(addMonths(d, 1), -1);

/** The period ending on `anchor` (`first`: the first record, for すべて). */
export function rangeFor(period: Period, anchor: LocalDate, first: LocalDate): Range {
  const len = DAYS[period];
  if (len) {
    const from = addDays(anchor, -len + 1);
    const step = period === 'quarter' ? 7 : 1;
    const buckets: Bucket[] = [];
    for (let d = from; d <= anchor; d = addDays(d, step)) buckets.push({ from: d, to: addDays(d, step - 1) });
    return { period, from, to: anchor, unit: step === 7 ? 'week' : 'day', buckets };
  }
  const from = period === 'year' ? addMonths(anchor, -11) : monthStart(first < anchor ? first : anchor);
  const buckets: Bucket[] = [];
  for (let d = from; d <= anchor; d = addMonths(d, 1)) buckets.push({ from: d, to: monthEnd(d) < anchor ? monthEnd(d) : anchor });
  return { period, from, to: anchor, unit: 'month', buckets };
}

/** The anchor one period back (dir −1) or on (+1), never past `today`. すべて doesn't move. */
export function shiftAnchor(period: Period, anchor: LocalDate, dir: -1 | 1, today: LocalDate): LocalDate {
  const len = DAYS[period];
  let next: LocalDate;
  if (len) next = addDays(anchor, dir * len);
  else if (period === 'year') next = monthEnd(addMonths(anchor, dir * 12));
  else return anchor;
  return next > today ? today : next;
}

/** Whether ‹ has anything to show (a record before this period) and › anything newer. */
export function canShift(r: Range, first: LocalDate, today: LocalDate): { back: boolean; on: boolean } {
  return { back: r.period !== 'all' && r.from > first, on: r.period !== 'all' && r.to < today };
}

/** The previous period of equal length (null for すべて). */
export function previousRange(r: Range, first: LocalDate): Range | null {
  if (r.period === 'all') return null;
  return rangeFor(r.period, addDays(r.from, -1), first);
}

// ---------- stats ----------

/** A bucket's value for one person: the day's value, or the average of a week's / month's recorded days. */
export interface BucketValue {
  /** null: no record in it. */
  v: number | null;
  /** Recorded days (today excluded unless it's the only day, for the day bar). */
  days: number;
  met: number;
  /** The goal (a bucket's: its last day's). */
  goal: number;
  /** A day bucket that is today (still running). */
  today: boolean;
}

const idx = (hs: HealthSeries, d: LocalDate) => daysBetween(hs.from, d);

/** Each bucket's value. A day bucket shows today's running value; longer buckets average the finished days only. */
export function bucketValues(hs: HealthSeries, p: PersonId, m: Metric, r: Range): BucketValue[] {
  const ps = hs.people[p];
  const vals = ps.values[m];
  return r.buckets.map((b) => {
    let sum = 0, days = 0, met = 0;
    const last = Math.min(idx(hs, b.to), idx(hs, hs.to));
    const isToday = r.unit === 'day' && b.from === hs.to;
    for (let i = Math.max(0, idx(hs, b.from)); i <= last; i++) {
      const v = vals[i];
      if (v === null || v === undefined) continue;
      if (i === idx(hs, hs.to) && !isToday) continue;
      sum += v;
      days++;
      if (metGoal(m, v, goalOf(ps, m, i))) met++;
    }
    const gi = Math.max(0, Math.min(last, idx(hs, b.to)));
    return { v: days ? sum / days : null, days, met, goal: goalOf(ps, m, gi), today: isToday };
  });
}

/** The 7-day average ending each day of the range (finished days only; null under ROLL_MIN recorded days). */
export function rolling7(hs: HealthSeries, p: PersonId, m: Metric, r: Range): (number | null)[] {
  const vals = hs.people[p].values[m];
  const today = idx(hs, hs.to);
  const out: (number | null)[] = [];
  for (let d = r.from; d <= r.to; d = addDays(d, 1)) {
    const end = idx(hs, d);
    if (end >= today || end < 0) {
      out.push(null);
      continue;
    }
    let sum = 0, k = 0;
    for (let i = Math.max(0, end - 6); i <= end; i++) {
      const v = vals[i];
      if (v !== null && v !== undefined) (sum += v), k++;
    }
    out.push(k >= ROLL_MIN ? sum / k : null);
  }
  return out;
}

export interface MetricStats {
  /** Average of the recorded, finished days (null: none). */
  avg: number | null;
  /** Recorded finished days. */
  days: number;
  /** Finished days in the period with no record (no data, the Watch not worn, the phone not carried), since the first activity record. */
  missing: number;
  /** Recorded days the goal was met. */
  met: number;
  best: { date: LocalDate; v: number } | null;
  /** Average vs the previous period's: (avg − prev) / prev; null without both. */
  change: number | null;
}

function rawStats(hs: HealthSeries, p: PersonId, m: Metric, from: LocalDate, to: LocalDate) {
  const ps = hs.people[p];
  const vals = ps.values[m];
  const lo = Math.max(0, idx(hs, from));
  const hi = Math.min(idx(hs, to), idx(hs, hs.to) - 1); // finished days only
  const counted = idx(hs, hs.activityFrom);
  let sum = 0, days = 0, met = 0, missing = 0;
  let best: MetricStats['best'] = null;
  for (let i = lo; i <= hi; i++) {
    const v = vals[i];
    if (v === null || v === undefined) {
      if (i >= counted) missing++;
      continue;
    }
    sum += v;
    days++;
    if (metGoal(m, v, goalOf(ps, m, i))) met++;
    if (!best || v > best.v) best = { date: addDays(hs.from, i), v };
  }
  return { avg: days ? sum / days : null, days, met, missing, best };
}

/** A period's numbers for one person and metric, with the change against the previous period. */
export function metricStats(hs: HealthSeries, p: PersonId, m: Metric, r: Range): MetricStats {
  const cur = rawStats(hs, p, m, r.from, r.to);
  const prevR = previousRange(r, hs.from);
  const prev = prevR && prevR.to >= hs.from ? rawStats(hs, p, m, prevR.from, prevR.to) : null;
  const change = cur.avg !== null && prev?.avg ? (cur.avg - prev.avg) / prev.avg : null;
  return { ...cur, change };
}

// ---------- weight ----------

export interface WeightBucket {
  /** The average weigh-in in the bucket (null: none). */
  kg: number | null;
  n: number;
  /** The trend at the bucket's end (null before the first weigh-in). */
  trend: number | null;
}

export function weightBuckets(hs: HealthSeries, p: PersonId, r: Range): WeightBucket[] {
  const ps = hs.people[p];
  return r.buckets.map((b) => {
    let sum = 0, n = 0;
    const last = Math.min(idx(hs, b.to), idx(hs, hs.to));
    for (let i = Math.max(0, idx(hs, b.from)); i <= last; i++) {
      const v = ps.kg[i];
      if (v !== null && v !== undefined) (sum += v), n++;
    }
    return { kg: n ? Math.round((sum / n) * 10) / 10 : null, n, trend: last >= 0 ? ps.trend[last] ?? null : null };
  });
}

export interface WeightStats {
  /** Weigh-ins in the period. */
  n: number;
  /** Their average. */
  avg: number | null;
  /** The trend at the period's end − the trend at its start (or at its first weigh-in). */
  change: number | null;
  /** That change per week. */
  perWeek: number | null;
  /** The trend at the period's end. */
  trend: number | null;
}

export function weightStats(hs: HealthSeries, p: PersonId, r: Range): WeightStats {
  const ps = hs.people[p];
  const lo = Math.max(0, idx(hs, r.from));
  const hi = Math.min(idx(hs, r.to), idx(hs, hs.to));
  let sum = 0, n = 0, firstI = -1;
  for (let i = lo; i <= hi; i++) {
    const v = ps.kg[i];
    if (v === null || v === undefined) continue;
    if (firstI < 0) firstI = i;
    sum += v;
    n++;
  }
  const end = hi >= 0 ? ps.trend[hi] ?? null : null;
  // the trend carried into the period, else its first weigh-in's
  const startI = lo > 0 && ps.trend[lo - 1] !== null ? lo - 1 : firstI;
  const start = startI >= 0 ? ps.trend[startI] ?? null : null;
  const change = n && end !== null && start !== null ? Math.round((end - start) * 10) / 10 : null;
  const days = startI >= 0 ? hi - startI : 0;
  return {
    n,
    avg: n ? Math.round((sum / n) * 10) / 10 : null,
    change,
    perWeek: change !== null && days >= 7 ? Math.round(((end! - start!) / days) * 7 * 100) / 100 : null,
    trend: n ? end : null
  };
}
