// History and editing (docs/design/history-and-editing.md §4–5): edits on top of the ベル model.
// Own data only (the sender is the subject), open weeks only (this week, and last week until Wednesday 04:00 JST).
import { describe, expect, it } from 'vitest';
import type { EventRow, MetricRow, PresenceRow, SnapshotRows, WorkoutRow } from '#lib/contract/api.ts';
import type { PersonId } from '#lib/types.ts';
import { weekDays } from '#lib/scoring/index.ts';
import { reduce } from './state.ts';
import { buildWeekView, metricAsOf } from './week.ts';
import { weekBells } from './bells.ts';
import { bellsLedger, dayDetail, editLog, historyWeeks, weekDetail } from './history.ts';

// A week of the economy: Sunday 19:30 = 11-22, the lock = Wednesday 11-25 04:00 JST.
const WK = '2026-11-16';
const DAYS = weekDays(WK);
const jst = (date: string, hm: string) => new Date(`${date}T${hm}:00+09:00`).toISOString();
const ms = (date: string, hm: string) => Date.parse(jst(date, hm));

let n = 0;
const ev = (at: string, person: PersonId, type: EventRow[3], data: object): EventRow => [at, person, `e${++n}`, type, JSON.stringify(data)];
const metric = (at: string, person: PersonId, date: string, m: MetricRow[3], v: number): MetricRow => [at, person, date, m, v];
const workout = (at: string, person: PersonId, id: string, date: string, type: string, min: number): WorkoutRow =>
  [at, person, id, date, type, jst(date, '18:00'), new Date(ms(date, '18:00') + min * 60_000).toISOString(), min, 110];

/** A good week for both: steps, 30 exercise minutes, Move, Stand, two Pilates days. */
function goodWeek(): SnapshotRows {
  const rows: SnapshotRows = { metrics: [], workouts: [], presence: [], events: [] };
  for (const p of ['A', 'B'] as PersonId[]) {
    for (const d of DAYS) {
      const at = jst(d, '22:00');
      rows.metrics.push(
        metric(at, p, d, 'steps', 9000), metric(at, p, d, 'exercise_min', 30), metric(at, p, d, 'move_kcal', 500), metric(at, p, d, 'stand_min', 150)
      );
    }
    rows.workouts.push(workout(jst(DAYS[1], '22:00'), p, `${p}-pil-1`, DAYS[1], 'Pilates', 40));
    rows.workouts.push(workout(jst(DAYS[3], '22:00'), p, `${p}-pil-2`, DAYS[3], 'Pilates', 40));
  }
  return rows;
}

const withRows = (base: SnapshotRows, add: Partial<SnapshotRows>): SnapshotRows => ({
  metrics: [...base.metrics, ...(add.metrics ?? [])],
  workouts: [...base.workouts, ...(add.workouts ?? [])],
  presence: [...base.presence, ...(add.presence ?? [])],
  events: [...base.events, ...(add.events ?? [])]
});

const LIVE = Infinity;
const WED_MID = ms(DAYS[2], '23:30'); // mid-week, open
const MON_AFTER = ms('2026-11-23', '12:00'); // after Sunday's harvest, before the lock
const THU_AFTER = ms('2026-11-26', '12:00'); // locked
/** A person's earnings of WK at `now` (live while the week is open: every row counts, also later-dated ones). */
const earnAt = (rows: SnapshotRows, p: PersonId, now = WED_MID) => weekBells(reduce(rows), WK, now)[p];
const strengthDates = (rows: SnapshotRows, p: PersonId) => earnAt(rows, p).days.filter((d) => d.gym).map((d) => d.date);
const minutesOf = (rows: SnapshotRows, p: PersonId) => earnAt(rows, p).days.reduce((n, d) => n + d.exerciseMin, 0);

describe('metric_set', () => {
  it('lowering lowers the live earnings', () => {
    const base = goodWeek();
    const before = earnAt(base, 'A');
    const rows = withRows(base, { events: [ev(jst(DAYS[2], '23:00'), 'A', 'metric_set', { date: DAYS[0], metric: 'steps', value: 3000 })] });
    const s = reduce(rows);
    expect(metricAsOf(s, 'A', DAYS[0], 'steps', WED_MID)).toBe(3000);
    expect(earnAt(rows, 'A').fruits.apple.weekDays).toBe(before.fruits.apple.weekDays - 1);
    const view = buildWeekView({ me: 'A', now: new Date(WED_MID).toISOString(), rows }, 'A', WED_MID);
    expect(view.people.A.fruits.apple.weekDays).toBe(before.fruits.apple.weekDays - 1);
  });

  it('a later, higher sync beats a metric_set; a lower one does not', () => {
    const set = ev(jst(DAYS[2], '09:00'), 'A', 'metric_set', { date: DAYS[0], metric: 'steps', value: 3000 });
    const higher = withRows(goodWeek(), { events: [set], metrics: [metric(jst(DAYS[2], '10:00'), 'A', DAYS[0], 'steps', 3500)] });
    expect(metricAsOf(reduce(higher), 'A', DAYS[0], 'steps', WED_MID)).toBe(3500);
    const lower = withRows(goodWeek(), { events: [set], metrics: [metric(jst(DAYS[2], '10:00'), 'A', DAYS[0], 'steps', 2000)] });
    expect(metricAsOf(reduce(lower), 'A', DAYS[0], 'steps', WED_MID)).toBe(3000);
    // Rows before the set are overridden even when higher (that is the point of lowering).
    expect(metricAsOf(reduce(higher), 'A', DAYS[0], 'steps', ms(DAYS[2], '09:30'))).toBe(3000);
  });

  it('latest edit wins by server `at`', () => {
    const rows = withRows(goodWeek(), {
      events: [
        ev(jst(DAYS[2], '09:00'), 'A', 'metric_set', { date: DAYS[0], metric: 'exercise_min', value: 10 }),
        ev(jst(DAYS[2], '09:05'), 'A', 'metric_set', { date: DAYS[0], metric: 'exercise_min', value: 55 })
      ]
    });
    expect(metricAsOf(reduce(rows), 'A', DAYS[0], 'exercise_min', WED_MID)).toBe(55);
  });

  it('an edit after the lock is ignored and the ベル never change', () => {
    const base = goodWeek();
    const rows = withRows(base, { events: [ev(new Date(THU_AFTER).toISOString(), 'A', 'metric_set', { date: DAYS[0], metric: 'steps', value: 30000 })] });
    const s = reduce(rows);
    expect(s.metricSets.A.size).toBe(0);
    expect(bellsLedger(s, THU_AFTER + 1000)).toEqual(bellsLedger(reduce(base), THU_AFTER + 1000));
    expect(editLog(s)).toEqual([]);
  });

  it('a raise before the lock counts, also after the lock', () => {
    // A thin week for A (no Watch minutes) so a raise has room to earn more.
    const base = goodWeek();
    base.metrics = base.metrics.map((r) => (r[1] === 'A' && r[3] === 'exercise_min' ? [r[0], r[1], r[2], r[3], 0] : r));
    const rows = withRows(base, { events: [ev(new Date(MON_AFTER).toISOString(), 'A', 'metric_set', { date: DAYS[0], metric: 'exercise_min', value: 60 })] });
    expect(earnAt(rows, 'A', THU_AFTER).daily).toBeGreaterThan(earnAt(base, 'A', THU_AFTER).daily);
  });

  it('lowering after Sunday, before the lock, lowers the week (no keep-the-max any more)', () => {
    const base = goodWeek();
    const lowered = withRows(base, { events: DAYS.map((d) => ev(new Date(MON_AFTER).toISOString(), 'A', 'metric_set', { date: d, metric: 'steps', value: 0 })) });
    expect(earnAt(lowered, 'A', THU_AFTER).daily).toBeLessThan(earnAt(base, 'A', THU_AFTER).daily);
    expect(earnAt(lowered, 'A', THU_AFTER).fruits.apple.weekDays).toBe(0);
  });

  it("the partner can't touch my data: the sender is always the subject", () => {
    const base = goodWeek();
    const rows = withRows(base, {
      events: [
        ev(jst(DAYS[2], '09:00'), 'B', 'metric_set', { date: DAYS[0], metric: 'steps', value: 100, person: 'A' }),
        ev(jst(DAYS[2], '09:01'), 'B', 'workout_edit', { id: 'A-pil-1', excluded: true })
      ]
    });
    const s = reduce(rows);
    expect(metricAsOf(s, 'A', DAYS[0], 'steps', WED_MID)).toBe(9000);
    expect(metricAsOf(s, 'B', DAYS[0], 'steps', WED_MID)).toBe(100);
    expect(s.workoutEdits).toEqual([]);
    expect(earnAt(rows, 'A')).toEqual(earnAt(base, 'A'));
  });

  it('refuses future days and out-of-range values', () => {
    const rows = withRows(goodWeek(), {
      events: [
        ev(jst(DAYS[2], '09:00'), 'A', 'metric_set', { date: DAYS[4], metric: 'steps', value: 5000 }),
        ev(jst(DAYS[2], '09:00'), 'A', 'metric_set', { date: DAYS[0], metric: 'steps', value: 100_001 }),
        ev(jst(DAYS[2], '09:00'), 'A', 'metric_set', { date: DAYS[0], metric: 'steps', value: 1.5 })
      ]
    });
    expect(reduce(rows).metricSets.A.size).toBe(0);
  });
});

describe('workouts', () => {
  it('strength:false on Pilates drops the strength day; null puts it back', () => {
    const off = withRows(goodWeek(), { events: [ev(jst(DAYS[2], '09:00'), 'A', 'workout_edit', { id: 'A-pil-1', strength: false })] });
    expect(strengthDates(off, 'A')).toEqual([DAYS[3]]);
    const back = withRows(off, { events: [ev(jst(DAYS[2], '09:10'), 'A', 'workout_edit', { id: 'A-pil-1', strength: null })] });
    expect(strengthDates(back, 'A')).toEqual([DAYS[1], DAYS[3]]);
  });

  it('no daily questions: a yoga workout counts only when marked as strength in きろく; an old confirm is ignored', () => {
    const base = withRows(goodWeek(), {
      workouts: [workout(jst(DAYS[2], '20:00'), 'A', 'A-yoga', DAYS[2], 'Yoga', 30)],
      events: [ev(jst(DAYS[2], '20:30'), 'A', 'confirm', { kind: 'workout', id: 'A-yoga', yes: true })]
    });
    expect(buildWeekView({ me: 'A', now: new Date(WED_MID).toISOString(), rows: base }, 'A', WED_MID).pending).toEqual([]);
    expect(strengthDates(base, 'A')).toEqual([DAYS[1], DAYS[3]]);
    const rows = withRows(base, { events: [ev(jst(DAYS[2], '21:00'), 'A', 'workout_edit', { id: 'A-yoga', strength: true })] });
    expect(strengthDates(rows, 'A')).toEqual([DAYS[1], DAYS[2], DAYS[3]]);
    expect(dayDetail(reduce(rows), DAYS[2], WED_MID).people.A.workouts).toMatchObject([{ id: 'A-yoga', strength: true, override: true }]);
  });

  it('excluded removes the workout from the earnings (its strength day), and can be undone', () => {
    const rows = withRows(goodWeek(), { events: [ev(jst(DAYS[4], '09:00'), 'A', 'workout_edit', { id: 'A-pil-2', excluded: true })] });
    expect(strengthDates(rows, 'A')).toEqual([DAYS[1]]);
    const day = dayDetail(reduce(rows), DAYS[3], ms(DAYS[4], '10:00'));
    expect(day.people.A.workouts).toMatchObject([{ id: 'A-pil-2', excluded: true, strength: false }]);
    const back = withRows(rows, { events: [ev(jst(DAYS[4], '09:30'), 'A', 'workout_edit', { id: 'A-pil-2', excluded: false })] });
    expect(strengthDates(back, 'A')).toEqual([DAYS[1], DAYS[3]]);
  });

  it('workout_add counts (a manual Pilates is a strength day); unknown types, bad minutes and locked days are refused', () => {
    const rows = withRows(goodWeek(), {
      events: [
        ev(jst(DAYS[2], '09:00'), 'A', 'workout_add', { id: 'm:1', date: DAYS[2], type: 'Pilates', durationMin: 30 }),
        ev(jst(DAYS[2], '09:00'), 'A', 'workout_add', { id: 'm:2', date: DAYS[0], type: 'Bowling', durationMin: 30 }),
        ev(jst(DAYS[2], '09:00'), 'A', 'workout_add', { id: 'm:3', date: DAYS[0], type: 'Yoga', durationMin: 601 }),
        ev(new Date(THU_AFTER).toISOString(), 'A', 'workout_add', { id: 'm:4', date: DAYS[0], type: 'Pilates', durationMin: 30 })
      ]
    });
    const s = reduce(rows);
    expect(s.manualWorkouts.A.map((w) => w.id)).toEqual(['m:1']);
    expect(strengthDates(rows, 'A')).toEqual([DAYS[1], DAYS[2], DAYS[3]]);
    expect(dayDetail(s, DAYS[2], WED_MID).people.A.workouts).toMatchObject([{ id: 'm:1', manual: true, strength: true }]);
  });
});

describe('old check-ins (ADR 0021)', () => {
  it('ticks and きろく fixes of the eating habits earn nothing and never show in the change log', () => {
    const at = jst(DAYS[6], '20:00');
    const rows = withRows(goodWeek(), {
      events: [
        ev(at, 'A', 'checkin', { date: DAYS[0], habit: 'no_sweets', done: true }),
        ev(at, 'A', 'checkin', { date: DAYS[1], habit: 'no_sweets', done: false, edit: true })
      ]
    });
    expect(earnAt(rows, 'A')).toEqual(earnAt(goodWeek(), 'A'));
    expect(editLog(reduce(rows))).toEqual([]);
    expect(weekDetail(reduce(rows), WK, WED_MID).people.A.days.map((d) => d.ticks)).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });
});

describe('history views', () => {
  const rows = withRows(goodWeek(), {
    events: [
      ev(jst(DAYS[2], '23:00'), 'A', 'metric_set', { date: DAYS[0], metric: 'steps', value: 7000 }),
      ev(jst(DAYS[2], '23:10'), 'B', 'metric_set', { date: DAYS[0], metric: 'exercise_min', value: 45 })
    ]
  });

  it('EditLog has who, when, before and after (value as of at − 1)', () => {
    expect(editLog(reduce(rows))).toEqual([
      { at: ms(DAYS[2], '23:00'), by: 'A', date: DAYS[0], field: 'steps', before: 9000, after: 7000 },
      { at: ms(DAYS[2], '23:10'), by: 'B', date: DAYS[0], field: 'exercise_min', before: 30, after: 45 }
    ]);
  });

  it('a Move or Stand edit (metric_set move_kcal / stand_min) re-prices the day and shows in the log and the ✎ fields', () => {
    const edited = withRows(goodWeek(), { events: [
      ev(jst(DAYS[2], '09:00'), 'A', 'metric_set', { date: DAYS[1], metric: 'move_kcal', value: 600 }),
      ev(jst(DAYS[2], '09:01'), 'A', 'metric_set', { date: DAYS[1], metric: 'stand_min', value: 180 })
    ] });
    const s = reduce(edited);
    expect(editLog(s)).toMatchObject([
      { by: 'A', date: DAYS[1], field: 'move_kcal', before: 500, after: 600 }, { by: 'A', date: DAYS[1], field: 'stand_min', before: 150, after: 180 }
    ]);
    expect(weekDetail(s, WK, WED_MID).people.A.days[1]).toMatchObject({
      moveKcal: 600, standMin: 180, rings: { pear: 180, cherry: 180 }, met: { pear: true, cherry: true }, editedFields: ['move', 'stand']
    });
    expect(dayDetail(s, DAYS[1], WED_MID).people.A).toMatchObject({ move: { value: 600, goal: 600, edited: true }, stand: { value: 180, edited: true } });
    expect(weekDetail(reduce(goodWeek()), WK, WED_MID).people.A.days[1].rings).toMatchObject({ pear: 150, cherry: 150 }); // 500 / 600 × 180
  });

  it('week list: newest first from the economy’s first week, both people, 7 stamps, locked and open flags', () => {
    const now = ms('2026-11-24', '12:00'); // Tuesday of the next week: WK's harvest opened, still open for edits
    const weeks = historyWeeks(reduce(rows), now);
    expect(weeks.map((w) => w.weekKey)).toEqual(['2026-11-23', '2026-11-16', '2026-11-09', '2026-11-02', '2026-10-26']); // the economy starts 2026-10-26
    const w = weeks[1];
    expect(w).toMatchObject({ settled: true, locked: false, open: true, current: false });
    expect(w.people.A.stamps).toEqual(['active', 'strength', 'active', 'strength', 'active', 'active', 'active']);
    expect(weeks[0].people.A.stamps.slice(2)).toEqual(['future', 'future', 'future', 'future', 'future']);
    const locked = historyWeeks(reduce(rows), THU_AFTER)[1];
    expect(locked).toMatchObject({ weekKey: WK, locked: true, open: false });
  });

  it('week detail and day detail show both people, the source of minutes and the change log', () => {
    const s = reduce(rows);
    const wd = weekDetail(s, WK, WED_MID);
    expect(wd.open).toBe(true);
    expect(wd.people.A.days[0]).toMatchObject({ steps: 7000, edited: true, exerciseMin: 30, minutes: 30, minutesSource: 'watch' });
    expect(wd.people.B.days[0]).toMatchObject({ exerciseMin: 45, minutesSource: 'edit', edited: true });
    expect(wd.people.A.days[4].future).toBe(true);
    const dd = dayDetail(s, DAYS[0], WED_MID);
    expect(dd.people.A.steps).toEqual({ value: 7000, edited: true });
    expect(dd.people.B.exercise).toMatchObject({ value: 45, source: 'edit', edited: true });
    expect(dd.people.B.minutes).toEqual(dd.people.B.exercise); // deprecated alias
    expect(dd.edits.map((e) => e.by)).toEqual(['B', 'A']);
    expect(dd.people.A.workouts).toEqual([]);
    expect(dayDetail(s, DAYS[1], WED_MID).people.A.workouts).toMatchObject([{ id: 'A-pil-1', type: 'Pilates', strength: true, excluded: false }]);
    expect(dayDetail(s, DAYS[0], THU_AFTER)).toMatchObject({ open: false, locked: true });
  });
});

describe('round 7: manual workouts, lock boundaries, no-op edits', () => {
  const LOCK = ms('2026-11-25', '04:00');
  const add = (at: string, date: string, min: number, id = `m:add-${++n}`) => ev(at, 'A', 'workout_add', { id, date, type: 'Pilates', durationMin: min });

  it('a hand-added workout counts toward the exercise minutes as max(Watch, manual), never summed', () => {
    const base = goodWeek(); // 30 Watch minutes a day
    const s0 = reduce(base);
    const d0 = dayDetail(s0, DAYS[0], WED_MID).people.A.exercise.value;
    // A shorter manual workout than the day's minutes changes nothing (no double counting).
    const small = withRows(base, { events: [add(jst(DAYS[2], '23:00'), DAYS[0], Math.max(10, d0 - 5))] });
    expect(minutesOf(small, 'A')).toBe(minutesOf(base, 'A'));
    // A longer one replaces the day's minutes (the ベル still cap at 60 minutes).
    const big = withRows(base, { events: [add(jst(DAYS[2], '23:00'), DAYS[0], d0 + 20)] });
    expect(minutesOf(big, 'A') - minutesOf(base, 'A')).toBe(20);
    const dd = dayDetail(reduce(big), DAYS[0], WED_MID).people.A.exercise;
    expect(dd).toMatchObject({ value: d0 + 20, source: 'manual' });
    expect(weekDetail(reduce(big), WK, WED_MID).people.A.days[0]).toMatchObject({ minutesSource: 'manual', editedFields: ['workout'] });
  });

  it('two manual workouts on a day add up with each other (but still only against the larger source)', () => {
    const rows: SnapshotRows = { metrics: [], workouts: [], presence: [], events: [add(jst(DAYS[1], '20:00'), DAYS[1], 25), add(jst(DAYS[1], '21:00'), DAYS[1], 20)] };
    expect(dayDetail(reduce(rows), DAYS[1], WED_MID).people.A.exercise).toMatchObject({ value: 45, source: 'manual' });
    expect(minutesOf(rows, 'A')).toBe(45);
  });

  it('an excluded manual workout stops counting', () => {
    const id = 'm:x1';
    const rows: SnapshotRows = { metrics: [], workouts: [], presence: [], events: [add(jst(DAYS[1], '20:00'), DAYS[1], 40, id), ev(jst(DAYS[1], '21:00'), 'A', 'workout_edit', { id, excluded: true })] };
    expect(minutesOf(rows, 'A')).toBe(0);
  });

  it('an edit exactly at the lock is refused; one millisecond before counts', () => {
    const set = () => ['', 'A', `e${++n}`, 'metric_set', JSON.stringify({ date: DAYS[0], metric: 'steps', value: 1234 })] as EventRow;
    const at = (t: number) => { const r = set(); r[0] = new Date(t).toISOString(); return r; };
    expect(metricAsOf(reduce(withRows(goodWeek(), { events: [at(LOCK)] })), 'A', DAYS[0], 'steps', LIVE)).toBe(9000);
    expect(metricAsOf(reduce(withRows(goodWeek(), { events: [at(LOCK - 1)] })), 'A', DAYS[0], 'steps', LIVE)).toBe(1234);
  });

  it('at 00:00 JST Monday, Sunday is still editable (last week) and Monday has just begun', () => {
    const MON0 = ms('2026-11-23', '00:00');
    const set = (date: string) => ev(new Date(MON0).toISOString(), 'A', 'metric_set', { date, metric: 'steps', value: 4321 });
    const s = reduce(withRows(goodWeek(), { events: [set(DAYS[6]), set('2026-11-23')] }));
    expect(metricAsOf(s, 'A', DAYS[6], 'steps', LIVE)).toBe(4321);
    expect(metricAsOf(s, 'A', '2026-11-23', 'steps', LIVE)).toBe(4321);
    // One millisecond earlier it is still Sunday: Monday is in the future and refused.
    const early = ev(new Date(MON0 - 1).toISOString(), 'A', 'metric_set', { date: '2026-11-23', metric: 'steps', value: 99 });
    expect(metricAsOf(reduce(withRows(goodWeek(), { events: [early] })), 'A', '2026-11-23', 'steps', LIVE)).toBeNull();
  });

  it('a metric_set that changes nothing is not in the change log (L8), and the log is memoised per state (L5)', () => {
    const rows = withRows(goodWeek(), {
      events: [
        ev(jst(DAYS[2], '23:00'), 'A', 'metric_set', { date: DAYS[0], metric: 'steps', value: 7000 }),
        ev(jst(DAYS[2], '23:05'), 'A', 'metric_set', { date: DAYS[0], metric: 'steps', value: 7000 })
      ]
    });
    const s = reduce(rows);
    expect(editLog(s).filter((e) => e.field === 'steps')).toHaveLength(1);
    expect(editLog(s)).toBe(editLog(s));
  });
});

describe('harvest taps (one acceptance rule for the island and きろく)', () => {
  const SUN = DAYS[6];
  const harvest = (at: string, person: PersonId, week = WK) => ev(at, person, 'harvest', { week });
  const view = (rows: SnapshotRows, me: PersonId, t: number) => buildWeekView({ me, now: new Date(t).toISOString(), rows }, me, t);
  const harvested = (rows: SnapshotRows, t: number) => historyWeeks(reduce(rows), t).find((w) => w.weekKey === WK)!.harvested;
  const AFTER = ms(SUN, '21:00');

  it('both taps after Sunday 19:30 harvest the week, in both views', () => {
    const rows = withRows(goodWeek(), { events: [harvest(jst(SUN, '19:40'), 'A'), harvest(jst(SUN, '20:00'), 'B')] });
    expect(view(rows, 'A', AFTER).harvest).toBeNull();
    expect(harvested(rows, AFTER)).toBe(true);
  });

  it('one tap: the island waits for the partner and きろく is not harvested', () => {
    const rows = withRows(goodWeek(), { events: [harvest(jst(SUN, '19:40'), 'A')] });
    expect(view(rows, 'B', AFTER).harvest).toMatchObject({ weekKey: WK, confirmedBy: ['A'] });
    expect(harvested(rows, AFTER)).toBe(false);
  });

  it('a tap before the harvest opened does not count anywhere (it used to show 収穫済 in きろく)', () => {
    const rows = withRows(goodWeek(), { events: [harvest(jst(SUN, '18:00'), 'A'), harvest(jst(SUN, '20:00'), 'B')] });
    expect(view(rows, 'A', AFTER).harvest).toMatchObject({ weekKey: WK, confirmedBy: ['B'] });
    expect(harvested(rows, AFTER)).toBe(false);
  });

  it('a tap for a week that is not the open one is ignored', () => {
    const rows = withRows(goodWeek(), { events: [harvest(jst(SUN, '19:40'), 'A', '2026-11-09'), harvest(jst(SUN, '20:00'), 'B')] });
    expect(view(rows, 'A', AFTER).harvest).toMatchObject({ weekKey: WK, confirmedBy: ['B'] });
    expect(harvested(rows, AFTER)).toBe(false);
  });
});

describe('presence rows (read-time rules in reduce)', () => {
  const pres = (at: string, person: PersonId, place: string, event: 'arrive' | 'leave', eventAt = at): PresenceRow => [at, person, place, event, eventAt];
  const kept = (presence: PresenceRow[], p: PersonId = 'A') => reduce({ metrics: [], workouts: [], presence, events: [] }).presence[p].map((e) => `arrive@${e.eventAt}`);
  const T = jst(DAYS[1], '18:00');

  it('a repeat arrive within 2 minutes is dropped, later than that it counts; leave rows are ignored', () => {
    expect(kept([pres(T, 'A', 'anytime', 'arrive'), pres(jst(DAYS[1], '18:02'), 'A', 'anytime', 'arrive')])).toEqual([`arrive@${new Date(T).toISOString()}`]);
    expect(kept([pres(T, 'A', 'anytime', 'arrive'), pres(jst(DAYS[1], '18:03'), 'A', 'anytime', 'arrive')])).toHaveLength(2);
    // A leave row (old Shortcuts) is ignored.
    expect(kept([pres(T, 'A', 'anytime', 'arrive'), pres(jst(DAYS[1], '18:40'), 'A', 'anytime', 'leave')])).toHaveLength(1);
    expect(kept([pres(T, 'A', 'anytime', 'leave')])).toEqual([]);
  });

  it('an event_at more than 48 h from the server `at` is ignored; within it, event_at is the time used', () => {
    expect(kept([pres(T, 'A', 'anytime', 'arrive', jst(DAYS[3], '18:01'))])).toEqual([]);
    expect(kept([pres(T, 'A', 'anytime', 'arrive', jst(DAYS[3], '17:59'))])).toEqual([`arrive@${new Date(jst(DAYS[3], '17:59')).toISOString()}`]);
  });

  it('an arrival is a strength day: no leave, no minimum stay, no question; twice a day is still one day', () => {
    const rows = withRows(goodWeek(), { presence: [
      pres(jst(DAYS[0], '19:00'), 'A', 'anytime', 'arrive'), pres(jst(DAYS[0], '20:30'), 'A', 'anytime', 'arrive'),
      pres(jst(DAYS[2], '07:00'), 'B', 'pt_studio', 'arrive'), pres(jst(DAYS[2], '08:00'), 'B', 'pt_studio', 'leave')
    ] });
    expect(strengthDates(rows, 'A')).toEqual([DAYS[0], DAYS[1], DAYS[3]]);
    expect(strengthDates(rows, 'B')).toEqual([DAYS[1], DAYS[2], DAYS[3]]);
    const s = reduce(rows);
    expect(dayDetail(s, DAYS[0], WED_MID).people.A.visits).toEqual([
      { id: `anytime@${jst(DAYS[0], '19:00')}`, place: 'エニタイム', arriveAt: jst(DAYS[0], '19:00') },
      { id: `anytime@${jst(DAYS[0], '20:30')}`, place: 'エニタイム', arriveAt: jst(DAYS[0], '20:30') }
    ]);
    expect(buildWeekView(s, 'A', WED_MID).pending).toEqual([]);
  });

  it("an unknown place, or another person's place, is ignored", () => {
    expect(kept([pres(T, 'A', 'nowhere', 'arrive')])).toEqual([]);
    expect(kept([pres(T, 'A', 'pt_studio', 'arrive')])).toEqual([]);
    expect(kept([pres(T, 'A', 'pt_studio', 'arrive')], 'B')).toEqual([]);
    expect(kept([pres(T, 'B', 'pt_studio', 'arrive')], 'B')).toHaveLength(1);
  });
});
