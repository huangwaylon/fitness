// きろく (history-and-editing.md): every recorded week, day and yen, for both people, computed on read from the same
// state as the WeekView. Pure; the UI asks for one opened week or day at a time (lazy).
import type { FruitKey, LocalDate, PersonId, WeekKey, WeekScore } from '#lib/types.ts';
import { DAILY, FRUITS, STRENGTH } from '#lib/config/rules.ts';
import { PLACES } from '#lib/config/places.ts';
import {
  addDays, isStrengthWorkout, manualMinutesByDay, minuteSourcesMilli, payoutWeek, scoreWeek, targetsFor, weekDays, weekKeyOf
} from '#lib/scoring/index.ts';
import { allWorkouts, editableAt, finalMs, firstWeek, isLockedAt, latestAt, latestTimed, localDateAt, PEOPLE_IDS, type State } from './state.ts';
import {
  activityAsOf, buckets, jarSum, maxBuckets, metricAsOf, monthOfWeek, paidAt, pctOf, purseSum, replayHarvests, replayPurse, settledWeeks, settleWeek, transferDoneAt, weekDates, weekInput, workoutsAsOf,
  type Activity, type Buckets, type SettledWeek, type SpendLog
} from './week.ts';

const LIVE = Infinity;

export type Stamp = 'strength' | 'active' | 'none' | 'future';
/** Where a day's counted minutes come from: the Watch, a きろく edit of them, the steps, or workouts added by hand. */
type MinutesSource = 'watch' | 'edit' | 'steps' | 'manual';

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

interface HistoryPerson { score: number; stamps: Stamp[] }

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

interface WeekCalc { t: number; scores: Record<PersonId, WeekScore>; act: Record<PersonId, Activity> }

function calc(s: State, wk: WeekKey, now: number): WeekCalc {
  const t = timeOf(wk, now);
  const act = { A: activityAsOf(s, 'A', t, weekDates(wk)), B: activityAsOf(s, 'B', t, weekDates(wk)) };
  const scores = { A: scoreWeek(weekInput(s, 'A', wk, t, act.A)), B: scoreWeek(weekInput(s, 'B', wk, t, act.B)) };
  return { t, scores, act };
}

interface DayMinutes {
  /** Counted minutes (before the daily cap): max(Watch, step-derived, manual workouts), never a sum (ADR 0011). */
  value: number;
  /** The Watch value (or its edit). */
  watch: number | null;
  source: MinutesSource | null;
}

/**
 * The one minutes rule for きろく (same as scoreWeek): the largest of the three sources. The Watch value reads as an
 * edit when the latest `metric_set` (at ≤ t) is what metricAsOf returns, i.e. no later ingest row beat it (round 7 L4).
 */
function dayMinutes(s: State, p: PersonId, date: LocalDate, t: number, steps: number | null, manualMin: number): DayMinutes {
  const watch = metricAsOf(s, p, date, 'exercise_min', t);
  const src = minuteSourcesMilli(steps, watch, manualMin, targetsFor(p, weekKeyOf(date)).stepGoal);
  const best = Math.max(src.watch, src.steps, src.manual);
  const value = Math.floor(best / 1000);
  if (steps === null && watch === null && manualMin === 0) return { value, watch, source: null };
  let source: MinutesSource;
  if (best > 0 && best === src.manual && src.manual > src.watch) source = 'manual';
  else if (best > 0 && best === src.steps && src.steps > src.watch) source = 'steps';
  else source = watchIsEdit(s, p, date, t) ? 'edit' : 'watch';
  return { value, watch, source };
}

function watchIsEdit(s: State, p: PersonId, date: LocalDate, t: number): boolean {
  const key = `${date}|exercise_min`;
  const set = latestTimed(s.metricSets[p].get(key), t);
  if (!set) return false;
  return !(s.metrics[p].get(key) ?? []).some((r) => r.at > set.at && r.at <= t && r.v > set.v);
}

/** Manual workout minutes per day for a person as of t (excluded ones don't count). */
const manualAsOf = (act: Activity): Map<LocalDate, number> => manualMinutesByDay(act.workouts);

function stampsFor(s: State, person: PersonId, wk: WeekKey, c: WeekCalc, today: LocalDate): Stamp[] {
  const goal = targetsFor(person, wk).stepGoal;
  const strength = new Set(c.scores[person].strengthDays);
  const manual = manualAsOf(c.act[person]);
  return weekDays(wk).map((date) => {
    if (date > today) return 'future';
    if (strength.has(date)) return 'strength';
    const steps = metricAsOf(s, person, date, 'steps', c.t);
    const { value } = dayMinutes(s, person, date, c.t, steps, manual.get(date) ?? 0);
    return (steps !== null && steps >= goal) || value >= DAILY.activeDayMin ? 'active' : 'none';
  });
}

function weekYen(wk: WeekKey, now: number, settled: SettledWeek | undefined, c: WeekCalc): { yen: number; estimate: boolean; breakdown: Buckets } {
  const live = buckets(payoutWeek(c.scores.A, c.scores.B));
  if (!settled) return { yen: jarSum(live), estimate: true, breakdown: live };
  const paid = paidAt(settled, now);
  if (now >= finalMs(wk)) return { yen: jarSum(paid), estimate: false, breakdown: paid };
  // Paid on Sunday, still open: a late raise tops it up on Wednesday 04:00 (never down).
  const projected = maxBuckets(paid, live);
  return { yen: jarSum(projected), estimate: jarSum(projected) > jarSum(paid), breakdown: projected };
}

/** Every week from the first paid week (or this week, before the season starts) to this week, newest first. */
export function historyWeeks(s: State, now: number): HistoryWeek[] {
  const today = localDateAt(now);
  const cur = weekKeyOf(today);
  const settled = new Map(settledWeeks(s, now).map((w) => [w.weekKey, w]));
  const harvested = new Set([...replayHarvests(s, now)].filter(([, by]) => by.size === 2).map(([wk]) => wk));
  const out: HistoryWeek[] = [];
  const start = firstWeek(s) < cur ? firstWeek(s) : cur;
  for (let wk = cur; wk >= start; wk = addDays(wk, -7)) {
    const c = calc(s, wk, now);
    const y = weekYen(wk, now, settled.get(wk), c);
    out.push({
      weekKey: wk,
      current: wk === cur,
      settled: settled.has(wk),
      yen: y.yen,
      estimate: y.estimate,
      locked: isLockedAt(s, wk, now),
      open: editableAt(wk, now), // this week, and last week until Wednesday 04:00
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

/** What an accepted edit changed, for the ✎ next to that number in the week table. */
type EditedField = 'steps' | 'minutes' | 'workout' | 'ticks';

interface DayRow {
  date: LocalDate;
  future: boolean;
  steps: number | null;
  /** Counted minutes (max of Watch, step-derived and manual workouts). */
  minutes: number;
  minutesSource: MinutesSource | null;
  strength: boolean;
  ticks: number;
  /** An accepted edit touched this person's day. */
  edited: boolean;
  editedFields: EditedField[];
}

const FIELD_OF: Record<EditLog['field'], EditedField> = {
  steps: 'steps', exercise_min: 'minutes', workout_strength: 'workout', workout_excluded: 'workout', workout_add: 'workout', checkin: 'ticks'
};

interface WeekDetailPerson {
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

function editedFields(s: State, person: PersonId): Map<LocalDate, Set<EditedField>> {
  const out = new Map<LocalDate, Set<EditedField>>();
  for (const e of editLog(s)) if (e.by === person) (out.get(e.date) ?? out.set(e.date, new Set()).get(e.date)!).add(FIELD_OF[e.field]);
  return out;
}

export function weekDetail(s: State, wk: WeekKey, now: number): WeekDetail {
  const today = localDateAt(now);
  const c = calc(s, wk, now);
  const settled = settleWeek(s, wk, now) ?? undefined;
  const y = weekYen(wk, now, settled, c);
  const person = (p: PersonId): WeekDetailPerson => {
    const score = c.scores[p];
    const input = weekInput(s, p, wk, c.t, c.act[p]);
    const edited = editedFields(s, p);
    const manual = manualAsOf(c.act[p]);
    const strength = new Set(score.strengthDays);
    return {
      score: score.score,
      fruits: Object.fromEntries(FRUITS.map((k) => {
        const cat = score.categories[k];
        return [k, { actual: cat.actual, target: cat.target, pct: pctOf(cat) }];
      })) as WeekDetailPerson['fruits'],
      days: input.days.map((d) => {
        const m = dayMinutes(s, p, d.date, c.t, d.steps, manual.get(d.date) ?? 0);
        const fields = [...(edited.get(d.date) ?? [])];
        return {
          date: d.date,
          future: d.date > today,
          steps: d.steps,
          minutes: m.value,
          minutesSource: m.source,
          strength: strength.has(d.date),
          ticks: Math.min(DAILY.maxTicks, new Set(input.checkins.filter((x) => x.date === d.date).map((x) => x.habit)).size),
          edited: fields.length > 0,
          editedFields: fields
        };
      })
    };
  };
  return {
    weekKey: wk,
    current: wk === weekKeyOf(today),
    settled: !!settled,
    locked: isLockedAt(s, wk, now),
    open: editableAt(wk, now),
    lockAt: finalMs(wk),
    yen: y.yen,
    estimate: y.estimate,
    breakdown: y.breakdown,
    people: { A: person('A'), B: person('B') }
  };
}

// ---------- day detail ----------

interface DayWorkout {
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

interface DayVisit { id: string; place: string; arriveAt: string; dwellMin: number; counted: boolean }

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
    const steps = metricAsOf(s, p, date, 'steps', t);
    const m = dayMinutes(s, p, date, t, steps, manualAsOf(c.act[p]).get(date) ?? 0);
    const strengthDays = new Set(c.scores[p].strengthDays);
    const counted = new Map(c.act[p].workouts.map((w) => [w.id, w]));
    const workouts = allWorkouts(s, p)
      .filter((w) => w.date === date && w.at <= t)
      .sort((x, y) => x.startAt.localeCompare(y.startAt))
      .map((w): DayWorkout => {
        const key = `${p}|${w.id}`;
        const live = counted.get(w.id);
        return {
          id: w.id, type: w.type, startAt: w.startAt, durationMin: w.durationMin,
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
      minutes: { ...m, edited: mine.some((e) => e.field === 'exercise_min') },
      workouts,
      visits,
      habits: { keys: targetsFor(p, wk).habits, done: input.checkins.filter((x) => x.date === date).map((x) => x.habit) }
    };
  };
  return {
    date, weekKey: wk, future: date > localDateAt(now), locked: isLockedAt(s, wk, now), open: editableAt(date, now),
    lockAt: finalMs(wk), people: { A: person('A'), B: person('B') }, edits: [...log].reverse()
  };
}

// ---------- the change log ----------

const logs = new WeakMap<State, EditLog[]>();

/**
 * Every accepted edit in server order (the sheet stays the raw audit; refused edits and no-op edits never show).
 * Memoised per State (a State is never mutated; round 7 L5).
 */
export function editLog(s: State): EditLog[] {
  let out = logs.get(s);
  if (!out) logs.set(s, (out = buildEditLog(s)));
  return out;
}

function buildEditLog(s: State): EditLog[] {
  const out: EditLog[] = [];
  for (const p of PEOPLE_IDS) {
    for (const [key, list] of s.metricSets[p]) {
      const [date, field] = key.split('|') as [LocalDate, 'steps' | 'exercise_min'];
      for (const e of list) {
        const before = metricAsOf(s, p, date, field, e.at - 1);
        const after = metricAsOf(s, p, date, field, e.at);
        if (before !== after) out.push({ at: e.at, by: p, date, field, before, after });
      }
    }
    const ticks = new Map<string, State['checkins'][PersonId]>();
    for (const c of s.checkins[p]) {
      const k = `${c.date}|${c.habit}`;
      const earlier = ticks.get(k) ?? ticks.set(k, []).get(k)!;
      if (c.edit) {
        const before = earlier.findLast((x) => x.at < c.at)?.done ?? false;
        if (before !== c.done) out.push({ at: c.at, by: p, date: c.date, field: 'checkin', subject: c.habit, before, after: c.done });
      }
      earlier.push(c);
    }
    for (const w of s.manualWorkouts[p]) out.push({ at: w.at, by: p, date: w.date, field: 'workout_add', subject: w.type, before: null, after: w.durationMin });
  }
  const byId = new Map<string, { date: LocalDate; type: string; at: number }>();
  for (const p of PEOPLE_IDS) for (const w of allWorkouts(s, p)) byId.set(`${p}|${w.id}`, w);
  for (const e of s.workoutEdits) {
    const w = byId.get(`${e.person}|${e.id}`);
    if (!w) continue;
    if (e.at === w.at) continue; // the strength choice made with a workout_add is part of the add
    const counts = (t: number) => {
      const wo = workoutsAsOf(s, e.person, t, { from: w.date, to: w.date }).find((x) => x.id === e.id);
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

interface MoneyMonth {
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
    earnedPurse += purseSum(b);
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
