// きろく (history-and-editing.md): every recorded week, day and yen, for both people, computed on read from the same
// state as the WeekView. Pure; the UI asks for one opened week or day at a time (lazy).
import type { FruitKey, LocalDate, PersonId, WeekKey, WeekScore } from '#lib/types.ts';
import { FRUITS, STEP_MINUTES, STRENGTH } from '#lib/config/rules.ts';
import { PLACES } from '#lib/config/places.ts';
import { addDays, isStrengthWorkout, payoutWeek, scoreWeek, targetsFor, weekDays, weekKeyOf } from '#lib/scoring/index.ts';
import { editableAt, finalMs, firstWeek, isLockedAt, latestAt, localDateAt, PEOPLE_IDS, provisionalMs, type State } from './state.ts';
import {
  activityAsOf, buckets, jarSum, maxBuckets, metricAsOf, paidAt, replayPurse, settledWeeks, transferDoneAt, weekInput,
  type Activity, type Buckets, type SettledWeek, type SpendLog
} from './week.ts';

const LIVE = Infinity;
/** A day counts as active (●) from this many counted minutes, or on a step-goal day. */
export const ACTIVE_DAY_MIN = 20;

export type Stamp = 'strength' | 'active' | 'none' | 'future';
export type MinutesSource = 'watch' | 'steps' | 'edit';

/** One accepted edit, derived from the event rows (§4.4). `before` is the value as of `at − 1`. */
export interface EditLog {
  at: number;
  by: PersonId;
  date: LocalDate;
  field: 'steps' | 'exercise_min' | 'workout_strength' | 'workout_excluded' | 'workout_add' | 'checkin';
  /** Workout type (workout_*) or habit key (checkin). */
  subject?: string;
  before: number | boolean | null;
  after: number | boolean | null;
}

export interface HistoryPerson { score: number; stamps: Stamp[] }

export interface HistoryWeek {
  weekKey: WeekKey;
  current: boolean;
  /** Sunday 19:30 has passed: the week paid (at least its first payout). */
  settled: boolean;
  /** Jar yen of the week: paid, or the live estimate (`estimate`) while it can still change. */
  yen: number;
  estimate: boolean;
  locked: boolean;
  /** Edits for this week count right now. */
  open: boolean;
  /** Both tapped 壺に入れる. */
  harvested: boolean;
  people: Record<PersonId, HistoryPerson>;
}

/** Open weeks show live numbers; a closed week shows what it had at its lock (late syncs after it never paid). */
const timeOf = (wk: WeekKey, now: number): number => (now >= finalMs(wk) ? finalMs(wk) : LIVE);

/** The week is open for edits at `now` (this week, and last week until Wednesday 04:00). */
export const weekOpen = (wk: WeekKey, now: number): boolean => editableAt(wk, now) && !isLockedAt(wk, now);

interface WeekCalc { t: number; scores: Record<PersonId, WeekScore>; act: Record<PersonId, Activity> }

function calc(s: State, wk: WeekKey, now: number): WeekCalc {
  const t = timeOf(wk, now);
  const act = { A: activityAsOf(s, 'A', t), B: activityAsOf(s, 'B', t) };
  const scores = { A: scoreWeek(weekInput(s, 'A', wk, t, act.A)), B: scoreWeek(weekInput(s, 'B', wk, t, act.B)) };
  return { t, scores, act };
}

/** The day's counted minutes: max(Watch minutes, steps over the goal at STEP_MINUTES pace), never both. */
function dayMinutes(steps: number | null, watch: number | null, stepGoal: number): { minutes: number; fromSteps: boolean } {
  const fromSteps = steps === null ? 0 : Math.floor(Math.max(0, steps - stepGoal) / STEP_MINUTES.stepsPerMin);
  const w = watch ?? 0;
  return { minutes: Math.max(w, fromSteps), fromSteps: fromSteps > w };
}

function stampsFor(s: State, person: PersonId, wk: WeekKey, c: WeekCalc, today: LocalDate): Stamp[] {
  const goal = targetsFor(person, wk).stepGoal;
  const strength = new Set(c.scores[person].strengthDays);
  return weekDays(wk).map((date) => {
    if (date > today) return 'future';
    if (strength.has(date)) return 'strength';
    const steps = metricAsOf(s, person, date, 'steps', c.t);
    const { minutes } = dayMinutes(steps, metricAsOf(s, person, date, 'exercise_min', c.t), goal);
    return (steps !== null && steps >= goal) || minutes >= ACTIVE_DAY_MIN ? 'active' : 'none';
  });
}

function weekYen(s: State, wk: WeekKey, now: number, settled: SettledWeek | undefined, c: WeekCalc): { yen: number; estimate: boolean; breakdown: Buckets } {
  const live = buckets(payoutWeek(c.scores.A, c.scores.B));
  if (!settled) return { yen: jarSum(live), estimate: true, breakdown: live };
  const paid = paidAt(settled, now);
  if (isLockedAt(wk, now) || now >= finalMs(wk)) return { yen: jarSum(paid), estimate: false, breakdown: paid };
  // Paid on Sunday, still open: a late raise tops it up on Wednesday 04:00 (never down).
  const projected = maxBuckets(paid, live);
  return { yen: jarSum(projected), estimate: jarSum(projected) > jarSum(paid), breakdown: projected };
}

/** Every week from the first paid week (or this week, before the season starts) to this week, newest first. */
export function historyWeeks(s: State, now: number): HistoryWeek[] {
  const today = localDateAt(now);
  const cur = weekKeyOf(today);
  const settled = new Map(settledWeeks(s, now).map((w) => [w.weekKey, w]));
  const harvested = new Set<WeekKey>();
  const taps = new Map<WeekKey, Set<PersonId>>();
  for (const h of s.harvests) if (h.at <= now) (taps.get(h.week) ?? taps.set(h.week, new Set()).get(h.week)!).add(h.person);
  for (const [wk, set] of taps) if (set.size === 2) harvested.add(wk);
  const out: HistoryWeek[] = [];
  const start = firstWeek() < cur ? firstWeek() : cur;
  for (let wk = cur; wk >= start; wk = addDays(wk, -7)) {
    const c = calc(s, wk, now);
    const y = weekYen(s, wk, now, settled.get(wk), c);
    out.push({
      weekKey: wk,
      current: wk === cur,
      settled: settled.has(wk),
      yen: y.yen,
      estimate: y.estimate,
      locked: isLockedAt(wk, now),
      open: weekOpen(wk, now),
      harvested: harvested.has(wk),
      people: {
        A: { score: c.scores.A.score, stamps: stampsFor(s, 'A', wk, c, today) },
        B: { score: c.scores.B.score, stamps: stampsFor(s, 'B', wk, c, today) }
      }
    });
  }
  return out;
}

// ---------- week detail ----------

export interface DayRow {
  date: LocalDate;
  future: boolean;
  steps: number | null;
  /** Counted minutes (max of Watch and step-derived). */
  minutes: number;
  minutesSource: MinutesSource | null;
  strength: boolean;
  ticks: number;
  /** An accepted edit touched this person's day. */
  edited: boolean;
}

export interface WeekDetailPerson {
  score: number;
  fruits: Record<FruitKey, { actual: number; target: number; pct: number }>;
  days: DayRow[];
}

export interface WeekDetail {
  weekKey: WeekKey;
  current: boolean;
  settled: boolean;
  locked: boolean;
  open: boolean;
  /** Epoch ms of the lock (Wednesday 04:00 JST after the week). */
  lockAt: number;
  yen: number;
  estimate: boolean;
  breakdown: Buckets;
  people: Record<PersonId, WeekDetailPerson>;
}

function editedDates(s: State, person: PersonId): Set<LocalDate> {
  return new Set(editLog(s).filter((e) => e.by === person).map((e) => e.date));
}

export function weekDetail(s: State, wk: WeekKey, now: number): WeekDetail {
  const today = localDateAt(now);
  const c = calc(s, wk, now);
  const settled = settledWeeks(s, now).find((w) => w.weekKey === wk);
  const y = weekYen(s, wk, now, settled, c);
  const person = (p: PersonId): WeekDetailPerson => {
    const score = c.scores[p];
    const goal = targetsFor(p, wk).stepGoal;
    const input = weekInput(s, p, wk, c.t, c.act[p]);
    const edited = editedDates(s, p);
    const strength = new Set(score.strengthDays);
    return {
      score: score.score,
      fruits: Object.fromEntries(FRUITS.map((k) => {
        const cat = score.categories[k];
        return [k, { actual: cat.actual, target: cat.target, pct: cat.maxMilli > 0 ? Math.floor((cat.milli * 100) / cat.maxMilli) : 0 }];
      })) as WeekDetailPerson['fruits'],
      days: input.days.map((d) => {
        const m = dayMinutes(d.steps, d.exerciseMin, goal);
        const setMin = latestAt(s.metricSets[p].get(`${d.date}|exercise_min`), c.t);
        return {
          date: d.date,
          future: d.date > today,
          steps: d.steps,
          minutes: m.minutes,
          minutesSource: d.steps === null && d.exerciseMin === null ? null : m.fromSteps ? 'steps' : setMin !== undefined && setMin === d.exerciseMin ? 'edit' : 'watch',
          strength: strength.has(d.date),
          ticks: Math.min(3, new Set(input.checkins.filter((x) => x.date === d.date).map((x) => x.habitKey)).size),
          edited: edited.has(d.date)
        };
      })
    };
  };
  return {
    weekKey: wk,
    current: wk === weekKeyOf(today),
    settled: !!settled,
    locked: isLockedAt(wk, now),
    open: weekOpen(wk, now),
    lockAt: finalMs(wk),
    yen: y.yen,
    estimate: y.estimate,
    breakdown: y.breakdown,
    people: { A: person('A'), B: person('B') }
  };
}

// ---------- day detail ----------

export interface DayWorkout {
  id: string;
  type: string;
  startAt: string;
  durationMin: number;
  /** Counts as a strength workout now. */
  strength: boolean;
  /** The きろく override (absent = automatic). */
  override: boolean | null;
  excluded: boolean;
  manual: boolean;
  /** Long enough to count as strength at all. */
  eligible: boolean;
}

export interface DayVisit { id: string; place: string; arriveAt: string; dwellMin: number; counted: boolean }

export interface DayPerson {
  steps: { value: number | null; edited: boolean };
  /** Counted minutes, the Watch value and where the counted number comes from. */
  minutes: { value: number; watch: number | null; source: MinutesSource | null; edited: boolean };
  workouts: DayWorkout[];
  visits: DayVisit[];
  habits: { keys: [string, string, string]; done: string[] };
}

export interface DayDetail {
  date: LocalDate;
  weekKey: WeekKey;
  future: boolean;
  locked: boolean;
  /** Edits to this day count now. */
  open: boolean;
  lockAt: number;
  people: Record<PersonId, DayPerson>;
  /** Accepted edits of this day, both people, newest first. */
  edits: EditLog[];
}

export function dayDetail(s: State, date: LocalDate, now: number): DayDetail {
  const wk = weekKeyOf(date);
  const c = calc(s, wk, now);
  const places = new Map(PLACES.map((p) => [p.key, p.name]));
  const log = editLog(s).filter((e) => e.date === date);
  const person = (p: PersonId): DayPerson => {
    const t = c.t;
    const goal = targetsFor(p, wk).stepGoal;
    const steps = metricAsOf(s, p, date, 'steps', t);
    const watch = metricAsOf(s, p, date, 'exercise_min', t);
    const m = dayMinutes(steps, watch, goal);
    const strengthDays = new Set(c.scores[p].strengthDays);
    const counted = new Map(c.act[p].workouts.map((w) => [w.extId, w]));
    const workouts = [...s.workouts[p], ...s.manualWorkouts[p]]
      .filter((w) => w.date === date && w.at <= t)
      .sort((x, y) => x.startAt.localeCompare(y.startAt))
      .map((w): DayWorkout => {
        const key = `${p}|${w.extId}`;
        const live = counted.get(w.extId);
        return {
          id: w.extId, type: w.type, startAt: w.startAt, durationMin: w.durationMin,
          strength: !!live && isStrengthWorkout(live), override: latestAt(s.workoutStrength.get(key), t) ?? null,
          excluded: !live, manual: !!w.manual, eligible: w.durationMin >= STRENGTH.minWorkoutMin
        };
      });
    const visits = c.act[p].visits.filter((v) => v.date === date).map((v): DayVisit => ({
      id: v.id, place: places.get(v.placeKey) ?? v.placeKey, arriveAt: v.arriveAt, dwellMin: v.dwellMin,
      counted: strengthDays.has(date) && v.dwellMin >= STRENGTH.minVisitMin && (v.autoStrength || v.confirmed === true)
    }));
    const input = weekInput(s, p, wk, t, c.act[p]);
    const mine = log.filter((e) => e.by === p);
    return {
      steps: { value: steps, edited: mine.some((e) => e.field === 'steps') },
      minutes: {
        value: m.minutes, watch,
        source: steps === null && watch === null ? null : m.fromSteps ? 'steps' : latestAt(s.metricSets[p].get(`${date}|exercise_min`), t) === watch && watch !== null ? 'edit' : 'watch',
        edited: mine.some((e) => e.field === 'exercise_min')
      },
      workouts,
      visits,
      habits: { keys: targetsFor(p, wk).habits, done: input.checkins.filter((x) => x.date === date).map((x) => x.habitKey) }
    };
  };
  return {
    date, weekKey: wk, future: date > localDateAt(now), locked: isLockedAt(wk, now), open: editableAt(date, now) && !isLockedAt(wk, now),
    lockAt: finalMs(wk), people: { A: person('A'), B: person('B') }, edits: [...log].reverse()
  };
}

// ---------- the change log ----------

/** Every accepted edit in server order (the sheet stays the raw audit; refused edits never show). */
export function editLog(s: State): EditLog[] {
  const out: EditLog[] = [];
  for (const p of PEOPLE_IDS) {
    for (const [key, list] of s.metricSets[p]) {
      const [date, field] = key.split('|') as [LocalDate, 'steps' | 'exercise_min'];
      for (const e of list) out.push({ at: e.at, by: p, date, field, before: metricAsOf(s, p, date, field, e.at - 1), after: metricAsOf(s, p, date, field, e.at) });
    }
    for (const c of s.checkins[p]) {
      if (!c.edit) continue;
      const before = s.checkins[p].filter((x) => x.at < c.at && x.date === c.date && x.habit === c.habit).at(-1)?.done ?? false;
      if (before !== c.done) out.push({ at: c.at, by: p, date: c.date, field: 'checkin', subject: c.habit, before, after: c.done });
    }
    for (const w of s.manualWorkouts[p]) out.push({ at: w.at, by: p, date: w.date, field: 'workout_add', subject: w.type, before: null, after: w.durationMin });
  }
  const byId = new Map<string, { date: LocalDate; type: string; at: number }>();
  for (const p of PEOPLE_IDS) for (const w of [...s.workouts[p], ...s.manualWorkouts[p]]) byId.set(`${p}|${w.extId}`, w);
  for (const e of s.workoutEdits) {
    const w = byId.get(`${e.person}|${e.id}`);
    if (!w) continue;
    if (e.at === w.at) continue; // the strength choice made with a workout_add is part of the add
    const counts = (t: number) => {
      const wo = activityAsOf(s, e.person, t).workouts.find((x) => x.extId === e.id);
      return !!wo && isStrengthWorkout(wo);
    };
    if (e.excluded !== undefined) {
      const was = latestAt(s.workoutExcluded.get(`${e.person}|${e.id}`), e.at - 1) ?? false;
      if (was !== e.excluded) out.push({ at: e.at, by: e.person, date: w.date, field: 'workout_excluded', subject: w.type, before: was, after: e.excluded });
    }
    if (e.strength !== undefined) {
      const before = counts(e.at - 1);
      const after = counts(e.at);
      if (before !== after) out.push({ at: e.at, by: e.person, date: w.date, field: 'workout_strength', subject: w.type, before, after });
    }
  }
  return out.sort((x, y) => x.at - y.at);
}

/** The accepted edits of one week (both people), newest first. */
export const weekEdits = (s: State, wk: WeekKey): EditLog[] => editLog(s).filter((e) => weekKeyOf(e.date) === wk).reverse();

// ---------- money ----------

export interface MoneyMonth {
  month: string;
  /** Jar yen of the month's weeks (by their Sunday), paid so far. */
  earnedYen: number;
  weeks: { weekKey: WeekKey; yen: number }[];
  /** The bank transfer of the month (from the next month on): ✓ or not yet. */
  transfer: { amountYen: number; done: boolean; at: number | null } | null;
  spends: SpendLog[];
}

export interface MoneyLog {
  totalYen: number;
  purseYen: number;
  /** The jar after each paid week, oldest first (the step line). */
  steps: { weekKey: WeekKey; totalYen: number }[];
  /** Newest first. */
  months: MoneyMonth[];
}

const monthOfWeek = (wk: WeekKey): string => addDays(wk, 6).slice(0, 7);

export function moneyLog(s: State, now: number): MoneyLog {
  const weeks = settledWeeks(s, now);
  const purse = replayPurse(s, weeks, now);
  const curMonth = localDateAt(now).slice(0, 7);
  let total = 0;
  let earnedPurse = 0;
  const steps: MoneyLog['steps'] = [];
  const months = new Map<string, MoneyMonth>();
  const monthOf = (m: string): MoneyMonth => {
    let x = months.get(m);
    if (!x) months.set(m, (x = { month: m, earnedYen: 0, weeks: [], transfer: null, spends: [] }));
    return x;
  };
  for (const w of weeks) {
    const b = paidAt(w, now);
    total += jarSum(b);
    earnedPurse += b.purseA + b.purseB;
    steps.push({ weekKey: w.weekKey, totalYen: total });
    const m = monthOf(monthOfWeek(w.weekKey));
    m.weeks.unshift({ weekKey: w.weekKey, yen: jarSum(b) });
    m.earnedYen += jarSum(b);
  }
  for (const sp of purse.log) monthOf(localDateAt(sp.at).slice(0, 7)).spends.unshift(sp);
  for (const m of months.values()) {
    if (m.month >= curMonth) continue;
    const t = transferDoneAt(s, m.month, now);
    if (m.earnedYen > 0 || t.done) m.transfer = { amountYen: m.earnedYen, done: t.done, at: t.at };
  }
  return {
    totalYen: total,
    purseYen: earnedPurse - purse.spentYen,
    steps,
    months: [...months.values()].sort((x, y) => y.month.localeCompare(x.month))
  };
}

/** Provisional cutoff of a week, re-exported for the UI's "paid on" line. */
export { provisionalMs };
