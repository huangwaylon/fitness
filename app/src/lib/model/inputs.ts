// The rows of one person as of a time T (only rows the server stamped at or before T): the inputs of the ベル
// earnings. Shared by the WeekView (week.ts), the ベル economy (bells.ts) and きろく (history.ts).
import type { CheckinTick, LocalDate, PersonId, Visit, WeekKey, Workout } from '#lib/types.ts';
import { PLACES } from '#lib/config/places.ts';
import { addDays, deriveVisits } from '#lib/scoring/index.ts';
import type { MetricKey } from '#lib/contract/api.ts';
import { allWorkouts, latestAt, latestTimed, type PresenceRec, type State } from './state.ts';

type VisitRec = Visit & { id: string };

/** An inclusive date window; the default is all time. Every per-week caller passes its week (perf: weeks × rows). */
export interface Dates { from: LocalDate; to: LocalDate }
const ALL: Dates = { from: '0000-00-00', to: '9999-99-99' };
export const weekDates = (wk: WeekKey): Dates => ({ from: wk, to: addDays(wk, 6) });

/** Ingested + manual workouts as of T, without the ones excluded from scoring, with their strength override. */
export function workoutsAsOf(s: State, person: PersonId, t: number, dates: Dates = ALL): Workout[] {
  const out: Workout[] = [];
  for (const w of allWorkouts(s, person)) {
    if (w.at > t || w.date < dates.from || w.date > dates.to) continue;
    const key = `${person}|${w.id}`;
    if (latestAt(s.workoutExcluded.get(key), t) === true) continue;
    const wo: Workout = {
      id: w.id, date: w.date, type: w.type, startAt: w.startAt, endAt: w.endAt, durationMin: w.durationMin, avgHr: w.avgHr,
      includesStrength: latestAt(s.workoutConfirms.get(key), t) ?? null
    };
    if (w.manual) wo.manual = true;
    const override = latestAt(s.workoutStrength.get(key), t);
    if (override !== undefined && override !== null) wo.strengthOverride = override;
    out.push(wo);
  }
  return out;
}

/**
 * Gym visits as of T whose arrive falls in `dates`. Exact with a window: events before it can only pair into visits
 * dated before it, and after it only the first event per place can still close an arrive inside it.
 */
function visitsAsOf(s: State, person: PersonId, t: number, dates: Dates = ALL): VisitRec[] {
  const firstAfter = new Map<string, PresenceRec>();
  const events = s.presence[person].filter((e) => {
    if (e.at > t || e.date < dates.from) return false;
    if (e.date <= dates.to) return true;
    const f = firstAfter.get(e.placeKey);
    if (!f || e.eventMs < f.eventMs || (e.eventMs === f.eventMs && e.n < f.n)) firstAfter.set(e.placeKey, e);
    return false;
  });
  events.push(...firstAfter.values());
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
export function ticksAsOf(s: State, person: PersonId, t: number, dates: Dates = ALL): Map<string, CheckinTick> {
  const on = new Map<string, CheckinTick>();
  for (const c of s.checkins[person]) {
    if (c.at > t) break;
    if (c.date < dates.from || c.date > dates.to) continue;
    const k = `${c.date}|${c.habit}`;
    if (c.done) {
      if (!on.has(k)) on.set(k, { date: c.date, habit: c.habit });
    } else on.delete(k);
  }
  return on;
}

/**
 * A day's metric as of T (history-and-editing.md §4.1). Ingest rows are append-only and higher-only, so their max ≤ T
 * is the latest value (and robust to a hand-edited sheet). A `metric_set` S (the latest with at ≤ T) overrides it, even
 * lower, but a later and higher sync still wins: max(S, ingest rows with S.at < at ≤ T).
 */
export function metricAsOf(s: State, person: PersonId, date: LocalDate, metric: MetricKey, t: number): number | null {
  const set = latestTimed(s.metricSets[person].get(`${date}|${metric}`), t);
  let best: number | null = set ? set.v : null;
  const after = set ? set.at : -Infinity;
  for (const r of s.metrics[person].get(`${date}|${metric}`) ?? []) if (r.at <= t && r.at > after && (best === null || r.v > best)) best = r.v;
  return best;
}

export interface Activity { workouts: Workout[]; visits: VisitRec[] }

export function activityAsOf(s: State, person: PersonId, t: number, dates: Dates): Activity {
  return { workouts: workoutsAsOf(s, person, t, dates), visits: visitsAsOf(s, person, t, dates) };
}

