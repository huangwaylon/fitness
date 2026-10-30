// Body-weight trend (ADR 0020): a calm view of where each person's weight is heading. Shown only: nothing here feeds
// the ベル economy (bells.ts never imports this file, and weight rows live in their own State maps).
//
// Rules:
// - A day's weight is the latest of its ingested rows and its きろく edits (`metric_set {metric:'weight'}`) stamped at
//   or before T. The Shortcut sends the day's first Body Mass sample (gas/parse.ts), and the server appends a row
//   whenever that value changes, so the latest row is the current one (unlike steps, which take the max).
// - The trend is an exponentially weighted moving average (WEIGHT.alpha = 0.1 a day, gap-aware), seeded with the
//   first weigh-in.
import type { LocalDate, PersonId } from '#lib/types.ts';
import { WEIGHT } from '#lib/config/rules.ts';
import { addDays } from '#lib/scoring/index.ts';
import { latestTimed, localDateAt, type State } from './state.ts';

export interface WeighIn { date: LocalDate; kg: number }
export interface WeightPoint extends WeighIn { trend: number }

export type WeightProjection =
  | { kind: 'reached' }
  /** The trend reaches the goal around `date` at the current pace. */
  | { kind: 'date'; date: LocalDate }
  /** Heading the other way, too slow, or too far out: no date (the UI stays encouraging). */
  | { kind: 'none' };

export interface WeightTrend {
  person: PersonId;
  /** Every weigh-in day with its trend, ascending. */
  points: WeightPoint[];
  start: WeightPoint | null;
  latest: WeightPoint | null;
  /** Trend now − the trend 7 days before the latest weigh-in; null without a weigh-in that far back. */
  weekChange: number | null;
  /** Trend now − the first weigh-in. */
  sinceStart: number | null;
  /** The trend's average change per week over the last WEIGHT.rateDays (null under WEIGHT.minRateDays of data). */
  perWeek: number | null;
  goal: number | null;
  projection: WeightProjection | null;
}

const DAY = 86_400_000;
export const daysBetween = (a: LocalDate, b: LocalDate): number => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY);
const round1 = (v: number) => Math.round(v * 10) / 10;
const round2 = (v: number) => Math.round(v * 100) / 100;

/** A day's weight as of T: the latest ingested row or edit stamped at or before T. */
export function weightOn(s: State, p: PersonId, date: LocalDate, t: number): number | null {
  const a = latestTimed(s.weights[p].get(date), t);
  const b = latestTimed(s.weightSets[p].get(date), t);
  if (!a && !b) return null;
  return !b || (a && a.at > b.at) ? a!.v : b.v;
}

/** Every day with a weight as of T (none after T's own date), ascending. */
export function weighIns(s: State, p: PersonId, t: number): WeighIn[] {
  const today = localDateAt(t);
  const dates = new Set([...s.weights[p].keys(), ...s.weightSets[p].keys()]);
  const out: WeighIn[] = [];
  for (const date of [...dates].sort()) {
    if (date > today) continue;
    const kg = weightOn(s, p, date, t);
    if (kg !== null) out.push({ date, kg });
  }
  return out;
}

/**
 * The trend through ascending weigh-ins: trend₀ = the first weight; then, g days after the previous weigh-in,
 * trend += (1 − (1 − α)^g) × (weight − trend). With daily weigh-ins that's the classic 10% EWMA.
 */
export function ewmaTrend(days: readonly WeighIn[], alpha: number = WEIGHT.alpha): WeightPoint[] {
  const out: WeightPoint[] = [];
  let trend = 0;
  let prev: LocalDate | null = null;
  for (const d of days) {
    if (prev === null) trend = d.kg;
    else {
      const g = Math.max(1, daysBetween(prev, d.date));
      trend += (1 - (1 - alpha) ** g) * (d.kg - trend);
    }
    prev = d.date;
    out.push({ date: d.date, kg: d.kg, trend: round2(trend) });
  }
  return out;
}

/** The trend on a date: the trend of the last weigh-in on or before it (null before the first). */
export function trendAt(points: readonly WeightPoint[], date: LocalDate): number | null {
  let v: number | null = null;
  for (const p of points) {
    if (p.date > date) break;
    v = p.trend;
  }
  return v;
}

/** Where the trend meets the goal at the current pace. */
export function project(latest: WeightPoint, start: WeightPoint, goal: number, perWeek: number | null): WeightProjection {
  const losing = goal <= start.kg;
  if (losing ? latest.trend <= goal : latest.trend >= goal) return { kind: 'reached' };
  const diff = goal - latest.trend;
  if (perWeek === null || Math.abs(perWeek) < WEIGHT.minPacePerWeek || Math.sign(perWeek) !== Math.sign(diff)) return { kind: 'none' };
  const weeks = diff / perWeek;
  if (weeks > WEIGHT.projectMaxWeeks) return { kind: 'none' };
  return { kind: 'date', date: addDays(latest.date, Math.ceil(weeks * 7)) };
}

/** One person's weight trend as of `now` (both people's are visible to both: ADR 0016). */
export function weightTrend(s: State, p: PersonId, now: number): WeightTrend {
  const points = ewmaTrend(weighIns(s, p, now));
  const goal = s.prefs[p].goalWeight ?? null;
  const start = points[0] ?? null;
  const latest = points.at(-1) ?? null;
  if (!start || !latest) return { person: p, points, start, latest, weekChange: null, sinceStart: null, perWeek: null, goal, projection: null };
  const weekAgo = trendAt(points, addDays(latest.date, -7));
  const span = Math.min(WEIGHT.rateDays, daysBetween(start.date, latest.date));
  const base = span >= WEIGHT.minRateDays ? trendAt(points, addDays(latest.date, -span)) : null;
  const perWeek = base === null ? null : round2(((latest.trend - base) / span) * 7);
  return {
    person: p, points, start, latest,
    weekChange: weekAgo === null ? null : round1(latest.trend - weekAgo),
    sinceStart: round1(latest.trend - start.kg),
    perWeek,
    goal,
    projection: goal === null ? null : project(latest, start, goal, perWeek)
  };
}
