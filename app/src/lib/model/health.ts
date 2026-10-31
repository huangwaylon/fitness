// けんこう (docs/design.md#kenkou, decisions.md "Health trends"): the Health data over time, one person at a time, as the
// personal trainer reads it. Pure and computed on read from the reduced State; nothing here feeds the ベル economy.
//
// Rules:
// - A day's value is Apple Health's latest row (metricAsOf at `now`), the truth for a trainer. (The ベル of a locked
//   week stay as of its lock, so a sync after a lock can show here and not in the ledger.)
// - As reported: every day with a row for a metric is a data point, whatever its value (0 steps, 66 steps, 12 kcal):
//   drawn as its bar and counted in the averages, best day, goal days and change. Nothing is cut off.
// - No record: only a day with no row for that metric (nothing received: before the first sync, a day the Shortcut
//   didn't cover). It has no bar (a short faint stub at the axis instead), stays out of the stats and is counted as 記録なし.
// - Weight: the period's weigh-ins, their average and the plain change (model/weight.ts plainChange: the first week's
//   average → the last week's, else the first weigh-in → the last), and from it the goal month.
// - Today is still running (a partial day): it is drawn (an outlined bar) but stays out of the stats.
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
import { plainChange, project, weighIns, type PlainChange, type WeighIn, type WeightProjection } from './weight.ts';

/** The four metrics in けんこう's order, steps first (🍎 Steps, 🍐 Move, 🍑 Exercise, 🍒 Stand; the island keeps the rings' order). */
export const METRICS = ['steps', 'move', 'exercise', 'stand'] as const;
export type Metric = (typeof METRICS)[number];
export const METRIC_FRUIT: Record<Metric, RingFruit> = { move: 'pear', exercise: 'peach', stand: 'cherry', steps: 'apple' };
const ROW: Record<Metric, ActivityMetric> = { move: 'move_kcal', exercise: 'exercise_min', stand: 'stand_min', steps: 'steps' };

export const PERIODS = ['week', 'month', 'quarter', 'year', 'all'] as const;
export type Period = (typeof PERIODS)[number];
/** Day-based periods: their length in days (1年 and すべて go by calendar month). */
const DAYS: Partial<Record<Period, number>> = { week: 7, month: 30, quarter: 91 };

/** One person's days, index i = `from` + i days: Apple Health's value as is, null = no row. */
interface PersonSeries {
  values: Record<Metric, (number | null)[]>;
  /** The Move goal in force each day (the other goals are fixed). */
  moveGoal: number[];
  /** That day's weigh-in (kg), null without one. */
  kg: (number | null)[];
  /** The weight goal (shown only). */
  goalWeight: number | null;
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
    const kgBy = new Map(weighIns(s, p, now).map((x) => [x.date, x.kg] as const));
    const kg: (number | null)[] = [];
    for (let i = 0, d = from; i < n; i++, d = addDays(d, 1)) {
      for (const m of METRICS) values[m].push(metricAsOf(s, p, d, ROW[m], now));
      moveGoal.push(moveGoalOn(s, p, d));
      kg.push(kgBy.get(d) ?? null);
    }
    return { values, moveGoal, kg, goalWeight: s.prefs[p].goalWeight ?? null };
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

export interface MetricStats {
  /** Average of the recorded, finished days (null: none). */
  avg: number | null;
  /** Recorded finished days. */
  days: number;
  /** Finished days in the period with no row for this metric, since the first activity record. */
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
    return { kg: n ? Math.round((sum / n) * 10) / 10 : null, n };
  });
}

export interface WeightStats {
  /** Weigh-ins in the period. */
  n: number;
  /** Their average. */
  avg: number | null;
  /** The plain change over the period (null under two weigh-ins). */
  change: PlainChange | null;
  /** With a goal and a change: reached, the month at the period's pace, or none. */
  projection: WeightProjection | null;
}

export function weightStats(hs: HealthSeries, p: PersonId, r: Range): WeightStats {
  const ps = hs.people[p];
  const lo = Math.max(0, idx(hs, r.from));
  const hi = Math.min(idx(hs, r.to), idx(hs, hs.to));
  const days: WeighIn[] = [];
  for (let i = lo; i <= hi; i++) {
    const kg = ps.kg[i];
    if (kg !== null && kg !== undefined) days.push({ date: addDays(hs.from, i), kg });
  }
  const n = days.length;
  const change = plainChange(days);
  return {
    n,
    avg: n ? Math.round((days.reduce((a, d) => a + d.kg, 0) / n) * 10) / 10 : null,
    change,
    projection: ps.goalWeight === null || !change ? null : project(change, ps.goalWeight)
  };
}
