// けんこう (docs/design.md#kenkou, decisions.md "Health trends"): the Health data over time, one person at a time, as the
// personal trainer reads it. Pure and computed on read from the reduced State; nothing here feeds the ベル economy.
//
// Rules:
// - A day's value is Apple Health's latest row (metricAsOf at `now`), the truth for a trainer. (The ベル of a locked
//   week stay as of its lock, so a sync after a lock can show here and not in the ledger.)
// - As reported: every day with a row for a metric is a data point, whatever its value (0 steps, 66 steps, 12 kcal):
//   drawn as its bar and counted in the averages, best day, goal days and change. Nothing is cut off, but for:
// - No watch (activityOn, the one reader of a day's activity: けんこう here, the TDEE's Move in model/profile.ts): the
//   Shortcut sends "0" when Health has no samples, so a day without the Watch arrives as Move 0, Exercise 0, Stand 0
//   (with the phone's steps). A day whose three watch metrics are all 0 or absent is a day the Watch wasn't worn: those
//   three are unknown that day (記録なし), steps stay. Read-time only: the stored rows stay as they are. The ベル need no
//   such rule (a 0 and a missing value earn no fruit alike: scoring/bells.ts).
// - No record: a day with no row for that metric (nothing received: before the first sync, a day the Shortcut didn't
//   cover), or a watch metric on a no-watch day. It has no bar (a short faint stub at the axis instead), stays out of
//   the stats and is counted as 記録なし.
// - Weight: the period's weigh-ins, their average and the plain change (model/weight.ts plainChange: the first week's
//   average → the last week's, else the first weigh-in → the last), and from it the goal month.
// - Body fat %, BMI, lean body mass (the body metrics): like weight, a day's latest row, sparse; the period's
//   measurements, their average and the same plain change. Each からだ card has its own optional goal (`goalWeight`,
//   `goalBodyFat`, `goalBmi`, `goalLean`), shown and projected the goal's way (contract/goals.ts GOALS dir).
// - Today is still running (a partial day): it is drawn (an outlined bar) but stays out of the stats.
// - A goal is met the goal's way (contract/goals.ts goalMet; every activity goal at least: whole Stand minutes, as the
//   stamp card) against that day's goal (dailyGoalOn: steps 8,000, Move the member's, Exercise 60, Stand 120 until
//   set; the ベル keep Exercise and Stand at the fixed 60 / 120). Days met / days recorded.
// - Periods end on an anchor day (today until ‹): 1週 = 7 days and 1か月 = 30 days by day, 3か月 = 13 weeks by week
//   (ending on the anchor), 1年 = 12 calendar months by month. The previous period is the same length just before
//   (1年: the 12 months before).
import type { LocalDate, PersonId, RingFruit } from '#lib/types.ts';
import { addDays, daysBetween, localDateAt } from '#lib/time/dates.ts';
import type { ActivityMetric, BodyMetric } from '#lib/contract/api.ts';
import { dailyGoalOn, latestAt, type State } from './state.ts';
import { goalMet, GOALS, type LatestGoalKey } from '#lib/contract/goals.ts';
import { metricAsOf } from './inputs.ts';
import { plainChange, project, weighIns, type PlainChange, type WeighIn, type WeightProjection } from './weight.ts';

/** The four activity metrics (🍎 Steps, 🍐 Move, 🍑 Exercise, 🍒 Stand; the island keeps the rings' order). */
const METRICS = ['steps', 'move', 'exercise', 'stand'] as const;
export type Metric = (typeof METRICS)[number];
/** The body metrics' cards (からだ, after 体重): body fat %, BMI, lean body mass. */
const BODY = ['body_fat_pct', 'bmi', 'lean_kg'] as const satisfies readonly BodyMetric[];
/** からだ's cards: 体重, then the body metrics (each a sparse series with an optional goal). */
const BODY_IDS = ['weight', ...BODY] as const;
export type BodyId = (typeof BODY_IDS)[number];
/** けんこう's two card groups, picked under the period: かつどう (activity) and からだ (body). */
export const GROUPS = ['activity', 'body'] as const;
export type Group = (typeof GROUPS)[number];
/**
 * Each group's cards in order (the user's: "move the body related metrics to the body metrics tab, and the remaining in
 * the activity tab"): かつどう 🍎 Steps, 🍐 Move, 🍑 Exercise, 🍒 Stand; からだ 体重, 体脂肪率, BMI, 除脂肪体重 (what a scale
 * writes at one weigh-in).
 */
export const CARDS = { activity: METRICS, body: BODY_IDS } as const satisfies Record<Group, readonly (Metric | BodyId)[]>;
export const METRIC_FRUIT: Record<Metric, RingFruit> = { move: 'pear', exercise: 'peach', stand: 'cherry', steps: 'apple' };
const ROW: Record<Metric, ActivityMetric> = { move: 'move_kcal', exercise: 'exercise_min', stand: 'stand_min', steps: 'steps' };

export const PERIODS = ['week', 'month', 'quarter', 'year'] as const;
export type Period = (typeof PERIODS)[number];
/** Day-based periods: their length in days (1年 goes by calendar month). */
const DAYS: Partial<Record<Period, number>> = { week: 7, month: 30, quarter: 91 };

/** One person's days, index i = `from` + i days: Apple Health's value as is, null = no row. */
interface PersonSeries {
  values: Record<Metric, (number | null)[]>;
  /** Each metric's goal in force on day i (model/state.ts dailyGoalOn). */
  goals: Record<Metric, number[]>;
  /** That day's weigh-in (kg) and body metrics (latest row), null without one. */
  dots: Record<BodyId, (number | null)[]>;
  /** The からだ goals (`goalWeight`, `goalBodyFat`, `goalBmi`, `goalLean`; shown only), null: none. */
  bodyGoals: Record<BodyId, number | null>;
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

/** The metrics only the Apple Watch records (Move, Exercise, Stand); steps come from the phone too. */
const WATCH = ['move', 'exercise', 'stand'] as const satisfies readonly Metric[];

/** Whether a day's values say the Watch wasn't worn: its three watch metrics all 0 or absent (the Shortcut's "0" for
 *  no samples). Any of them above 0 (Stand 9, say) is a worn day, its zeros real. */
export const noWatch = (v: Readonly<Record<Metric, number | null>>): boolean => WATCH.every((m) => !v[m]);

/** A day's activity as of `t` (each metric's latest row, null: none), its watch metrics null on a no-watch day
 *  (noWatch). Every reader of a day's activity outside the ベル goes through this. */
export function activityOn(s: State, p: PersonId, d: LocalDate, t: number): Record<Metric, number | null> {
  const v = { steps: 0, move: 0, exercise: 0, stand: 0 } as Record<Metric, number | null>;
  for (const m of METRICS) v[m] = metricAsOf(s, p, d, ROW[m], t);
  if (noWatch(v)) for (const m of WATCH) v[m] = null;
  return v;
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
  for (const p of ['A', 'B'] as PersonId[]) {
    for (const d of s.weights[p].keys()) if (d < from) from = d;
    for (const b of BODY) for (const d of s.body[p][b].keys()) if (d < from) from = d;
  }
  const any = from < to || (['A', 'B'] as PersonId[]).some((p) => s.metrics[p].has(to) || s.weights[p].has(to) || BODY.some((b) => s.body[p][b].has(to)));
  const n = daysBetween(from, to) + 1;
  const person = (p: PersonId): PersonSeries => {
    const values = { move: [], exercise: [], stand: [], steps: [] } as Record<Metric, (number | null)[]>;
    const goals = { move: [], exercise: [], stand: [], steps: [] } as Record<Metric, number[]>;
    const kgBy = new Map(weighIns(s, p, now).map((x) => [x.date, x.kg] as const));
    const dots = { weight: [], body_fat_pct: [], bmi: [], lean_kg: [] } as Record<BodyId, (number | null)[]>;
    for (let i = 0, d = from; i < n; i++, d = addDays(d, 1)) {
      const day = activityOn(s, p, d, now);
      for (const m of METRICS) {
        values[m].push(day[m]);
        goals[m].push(dailyGoalOn(s, p, m, d));
      }
      dots.weight.push(kgBy.get(d) ?? null);
      for (const b of BODY) dots[b].push(latestAt(s.body[p][b].get(d), now) ?? null);
    }
    const bodyGoals = Object.fromEntries(BODY_IDS.map((b) => [b, s.prefs[p][GOALS[b].key as LatestGoalKey] ?? null])) as Record<BodyId, number | null>;
    return { values, goals, dots, bodyGoals };
  };
  return { from, to, activityFrom, any, people: { A: person('A'), B: person('B') } };
}

/** A metric's goal on day i. */
const goalOf = (ps: PersonSeries, m: Metric, i: number): number => ps.goals[m][i];

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

/** The first day of the month `k` months from d's. */
function addMonths(d: LocalDate, k: number): LocalDate {
  const y = Number(d.slice(0, 4)), m = Number(d.slice(5, 7)) - 1 + k;
  const yy = y + Math.floor(m / 12), mm = ((m % 12) + 12) % 12;
  return `${yy}-${String(mm + 1).padStart(2, '0')}-01`;
}
const monthEnd = (d: LocalDate): LocalDate => addDays(addMonths(d, 1), -1);

/** The period ending on `anchor`. */
export function rangeFor(period: Period, anchor: LocalDate): Range {
  const len = DAYS[period];
  if (len) {
    const from = addDays(anchor, -len + 1);
    const step = period === 'quarter' ? 7 : 1;
    const buckets: Bucket[] = [];
    for (let d = from; d <= anchor; d = addDays(d, step)) buckets.push({ from: d, to: addDays(d, step - 1) });
    return { period, from, to: anchor, unit: step === 7 ? 'week' : 'day', buckets };
  }
  const from = addMonths(anchor, -11);
  const buckets: Bucket[] = [];
  for (let d = from; d <= anchor; d = addMonths(d, 1)) buckets.push({ from: d, to: monthEnd(d) < anchor ? monthEnd(d) : anchor });
  return { period, from, to: anchor, unit: 'month', buckets };
}

/** The anchor one period back (dir −1) or on (+1), never past `today`. */
export function shiftAnchor(period: Period, anchor: LocalDate, dir: -1 | 1, today: LocalDate): LocalDate {
  const len = DAYS[period];
  const next = len ? addDays(anchor, dir * len) : monthEnd(addMonths(anchor, dir * 12));
  return next > today ? today : next;
}

/** Whether ‹ has anything to show (a record before this period) and › anything newer. */
export function canShift(r: Range, first: LocalDate, today: LocalDate): { back: boolean; on: boolean } {
  return { back: r.from > first, on: r.to < today };
}

/** The previous period of equal length. */
export function previousRange(r: Range): Range {
  return rangeFor(r.period, addDays(r.from, -1));
}

// ---------- stats ----------

/** A bucket's value for one person: the day's value, or the average of a week's / month's recorded days. */
export interface BucketValue {
  /** null: no record in it. */
  v: number | null;
  /** Recorded days (today excluded unless it's the only day, for the day bar). */
  days: number;
  met: number;
  /** The goal (a bucket's: its last day's); null: none (no line). */
  goal: number | null;
  /** A day bucket that is today (still running). */
  today: boolean;
}

/**
 * One daily series on its own (a metric's, or another log's such as ごはん's kcal: model/food.ts foodSeries): index i =
 * `from` + i days, `to` today; null = no record that day. The bucket and stat rules below read only this.
 */
export interface DaySeries {
  from: LocalDate;
  to: LocalDate;
  /** Days before it aren't 記録なし (before anything was recorded). */
  first: LocalDate;
  vals: readonly (number | null)[];
  /** The goal on day i (null: none). */
  goal: (i: number) => number | null;
  /** Whether day i's value met its goal (none: never). */
  met?: (v: number, i: number) => boolean;
}

/** A metric's days as a DaySeries (its goal per day, met the goal's way). */
export function metricSeries(hs: HealthSeries, p: PersonId, m: Metric): DaySeries {
  const ps = hs.people[p];
  return {
    from: hs.from, to: hs.to, first: hs.activityFrom, vals: ps.values[m],
    goal: (i) => goalOf(ps, m, i), met: (v, i) => goalMet(m, v, goalOf(ps, m, i))
  };
}

/** Day d's index in a series starting on `s.from`. */
const idx = (s: { from: LocalDate }, d: LocalDate) => daysBetween(s.from, d);

/** Each bucket's value. A day bucket shows today's running value; longer buckets average the finished days only. */
export function seriesBuckets(ds: DaySeries, r: Range): BucketValue[] {
  const vals = ds.vals;
  const now = idx(ds, ds.to);
  return r.buckets.map((b) => {
    let sum = 0, days = 0, met = 0;
    const last = Math.min(idx(ds, b.to), now);
    const isToday = r.unit === 'day' && b.from === ds.to;
    for (let i = Math.max(0, idx(ds, b.from)); i <= last; i++) {
      const v = vals[i];
      if (v === null || v === undefined) continue;
      if (i === now && !isToday) continue;
      sum += v;
      days++;
      if (ds.met?.(v, i)) met++;
    }
    const gi = Math.max(0, Math.min(last, idx(ds, b.to)));
    return { v: days ? sum / days : null, days, met, goal: ds.goal(gi), today: isToday };
  });
}

interface MetricStats {
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

/** A series' numbers over from..to: the finished days only (today is still running), 記録なし from `first` on. */
interface SeriesStats extends Omit<MetricStats, 'change'> {
  /** The recorded finished days' total. */
  sum: number;
}

export function seriesStats(ds: DaySeries, from: LocalDate, to: LocalDate): SeriesStats {
  const vals = ds.vals;
  const lo = Math.max(0, idx(ds, from));
  const hi = Math.min(idx(ds, to), idx(ds, ds.to) - 1); // finished days only
  const counted = idx(ds, ds.first);
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
    if (ds.met?.(v, i)) met++;
    if (!best || v > best.v) best = { date: addDays(ds.from, i), v };
  }
  return { avg: days ? sum / days : null, sum, days, met, missing, best };
}

/** A period's numbers of a series, with the change of its average against the previous period's. */
export function periodStats(ds: DaySeries, r: Range): SeriesStats & { change: number | null } {
  const cur = seriesStats(ds, r.from, r.to);
  const prevR = previousRange(r);
  const prev = prevR.to >= ds.from ? seriesStats(ds, prevR.from, prevR.to) : null;
  return { ...cur, change: cur.avg !== null && prev?.avg ? (cur.avg - prev.avg) / prev.avg : null };
}

// ---------- weight ----------

/** A bucket of a sparse series (weight, a body metric): the average of its measurements, one decimal (null: none). */
export interface DotBucket {
  v: number | null;
  n: number;
}

function dotBuckets(hs: HealthSeries, vals: (number | null)[], r: Range): DotBucket[] {
  return r.buckets.map((b) => {
    let sum = 0, n = 0;
    const last = Math.min(idx(hs, b.to), idx(hs, hs.to));
    for (let i = Math.max(0, idx(hs, b.from)); i <= last; i++) {
      const v = vals[i];
      if (v !== null && v !== undefined) (sum += v), n++;
    }
    return { v: n ? Math.round((sum / n) * 10) / 10 : null, n };
  });
}

/** A からだ card's buckets: the average of each one's measurements. */
export const dotSeries = (hs: HealthSeries, p: PersonId, id: BodyId, r: Range): DotBucket[] => dotBuckets(hs, hs.people[p].dots[id], r);

/** A sparse series' measurements in the period (today's included), ascending; `kg` holds the value (plainChange's shape). */
function dotDays(hs: HealthSeries, vals: (number | null)[], r: Range): WeighIn[] {
  const lo = Math.max(0, idx(hs, r.from));
  const hi = Math.min(idx(hs, r.to), idx(hs, hs.to));
  const days: WeighIn[] = [];
  for (let i = lo; i <= hi; i++) {
    const v = vals[i];
    if (v !== null && v !== undefined) days.push({ date: addDays(hs.from, i), kg: v });
  }
  return days;
}
const avg1 = (days: WeighIn[]): number | null => (days.length ? Math.round((days.reduce((a, d) => a + d.kg, 0) / days.length) * 10) / 10 : null);

interface DotStats {
  /** Measurements in the period. */
  n: number;
  /** Their average. */
  avg: number | null;
  /** The plain change over the period (null under two measurements). */
  change: PlainChange | null;
  /** With a goal and a change: reached (the goal's way: under a ceiling, over a floor, near a value), the month at the
   *  period's pace, or none. */
  projection: WeightProjection | null;
}

/** A からだ card's numbers over a period: weight's or a body metric's, the same rules (model/weight.ts plainChange). */
export function dotStats(hs: HealthSeries, p: PersonId, id: BodyId, r: Range): DotStats {
  const days = dotDays(hs, hs.people[p].dots[id], r);
  const change = plainChange(days);
  const goal = hs.people[p].bodyGoals[id];
  const g = GOALS[id];
  return { n: days.length, avg: avg1(days), change, projection: goal === null || !change ? null : project(change, goal, g.dir, g.band) };
}
