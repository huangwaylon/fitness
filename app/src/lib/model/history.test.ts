// History and editing (docs/design/history-and-editing.md §4–5): edits are new behaviour on top of the golden model.
// Own data only (the sender is the subject), open weeks only (this week, and last week until Wednesday 04:00 JST).
import { describe, expect, it } from 'vitest';
import type { EventRow, MetricRow, SnapshotRows, WorkoutRow } from '#lib/ingest/sheet-api.ts';
import type { PersonId } from '#lib/types.ts';
import { weekDays } from '#lib/scoring/index.ts';
import { reduce } from './state.ts';
import { buildWeekView, metricAsOf, paidAt, payoutAsOf, settledWeeks, replayPurse } from './week.ts';
import { dayDetail, editLog, historyWeeks, moneyLog, weekDetail } from './history.ts';

// A scored (non-calibration) week of season 1: Sunday 19:30 = 11-22, the lock = Wednesday 11-25 04:00 JST.
const WK = '2026-11-16';
const DAYS = weekDays(WK);
const jst = (date: string, hm: string) => new Date(`${date}T${hm}:00+09:00`).toISOString();
const ms = (date: string, hm: string) => Date.parse(jst(date, hm));

let n = 0;
const ev = (at: string, person: PersonId, type: EventRow[3], data: object): EventRow => [at, person, `e${++n}`, type, JSON.stringify(data)];
const metric = (at: string, person: PersonId, date: string, m: 'steps' | 'exercise_min', v: number): MetricRow => [at, person, date, m, v];
const workout = (at: string, person: PersonId, id: string, date: string, type: string, min: number): WorkoutRow =>
  [at, person, id, date, type, jst(date, '18:00'), new Date(ms(date, '18:00') + min * 60_000).toISOString(), min, 110];

const HABITS: Record<PersonId, string[]> = { A: ['teishoku_lunch', 'low_salt_day', 'veg_two_meals'], B: ['eat_lunch', 'snack_swap', 'veg_two_meals'] };

/** A good week for both (score ≥ 60, so each earns a ¥1,000 purse): steps, minutes, two Pilates days, all ticks. */
function goodWeek(): SnapshotRows {
  const rows: SnapshotRows = { metrics: [], workouts: [], presence: [], events: [] };
  for (const p of ['A', 'B'] as PersonId[]) {
    for (const d of DAYS) {
      const at = jst(d, '22:00');
      rows.metrics.push(metric(at, p, d, 'steps', 9000), metric(at, p, d, 'exercise_min', 30));
      for (const h of HABITS[p]) rows.events.push(ev(at, p, 'checkin', { date: d, habit: h, done: true }));
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

const scoreAt = (rows: SnapshotRows, p: PersonId, t: number) => payoutAsOf(reduce(rows), WK, t)[p === 'A' ? 'a' : 'b'];
const LIVE = Infinity;
const WED_MID = ms(DAYS[2], '23:30'); // mid-week, open
const MON_AFTER = ms('2026-11-23', '12:00'); // after Sunday's payout, before the lock
const THU_AFTER = ms('2026-11-26', '12:00'); // locked

describe('metric_set', () => {
  it('lowering lowers the live score', () => {
    const base = goodWeek();
    const before = scoreAt(base, 'A', LIVE);
    const rows = withRows(base, { events: [ev(jst(DAYS[2], '23:00'), 'A', 'metric_set', { date: DAYS[0], metric: 'steps', value: 3000 })] });
    const s = reduce(rows);
    expect(metricAsOf(s, 'A', DAYS[0], 'steps', WED_MID)).toBe(3000);
    expect(scoreAt(rows, 'A', LIVE).categories.apple.actual).toBe(before.categories.apple.actual - 1);
    const view = buildWeekView({ me: 'A', now: new Date(WED_MID).toISOString(), rows }, 'A', WED_MID);
    expect(view.people.A.fruits.apple.actual).toBe(before.categories.apple.actual - 1);
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

  it('an edit after the lock is ignored and the yen never change', () => {
    const base = goodWeek();
    const rows = withRows(base, { events: [ev(new Date(THU_AFTER).toISOString(), 'A', 'metric_set', { date: DAYS[0], metric: 'steps', value: 30000 })] });
    const s = reduce(rows);
    expect(s.metricSets.A.size).toBe(0);
    expect(settledWeeks(s, THU_AFTER + 1000)).toEqual(settledWeeks(reduce(base), THU_AFTER + 1000));
    expect(editLog(s)).toEqual([]);
  });

  it('a raise before the lock tops the week up at Wednesday 04:00', () => {
    // A thin week for A (no Watch minutes) so a raise has room to pay more.
    const base = goodWeek();
    base.metrics = base.metrics.map((r) => (r[1] === 'A' && r[3] === 'exercise_min' ? [r[0], r[1], r[2], r[3], 0] : r));
    const rows = withRows(base, { events: [ev(new Date(MON_AFTER).toISOString(), 'A', 'metric_set', { date: DAYS[0], metric: 'exercise_min', value: 60 })] });
    const w = settledWeeks(reduce(rows), THU_AFTER).find((x) => x.weekKey === WK)!;
    const sunday = paidAt(w, MON_AFTER);
    const final = paidAt(w, THU_AFTER);
    expect(final.A).toBeGreaterThan(sunday.A);
  });

  it('lowering after Sunday keeps the Sunday payout (paid yen never go down)', () => {
    const base = goodWeek();
    const lowered = withRows(base, { events: DAYS.map((d) => ev(new Date(MON_AFTER).toISOString(), 'A', 'metric_set', { date: d, metric: 'steps', value: 0 })) });
    const w = settledWeeks(reduce(lowered), THU_AFTER).find((x) => x.weekKey === WK)!;
    expect(paidAt(w, THU_AFTER)).toEqual(paidAt(w, MON_AFTER));
    expect(paidAt(w, MON_AFTER)).toEqual(paidAt(settledWeeks(reduce(base), THU_AFTER).find((x) => x.weekKey === WK)!, MON_AFTER));
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
    expect(scoreAt(rows, 'A', LIVE)).toEqual(scoreAt(base, 'A', LIVE));
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
    expect(scoreAt(off, 'A', LIVE).strengthDays).toEqual([DAYS[3]]);
    const back = withRows(off, { events: [ev(jst(DAYS[2], '09:10'), 'A', 'workout_edit', { id: 'A-pil-1', strength: null })] });
    expect(scoreAt(back, 'A', LIVE).strengthDays).toEqual([DAYS[1], DAYS[3]]);
  });

  it('strength:true counts any type (and the ask question goes away)', () => {
    const base = withRows(goodWeek(), { workouts: [workout(jst(DAYS[2], '20:00'), 'A', 'A-yoga', DAYS[2], 'Yoga', 30)] });
    const v0 = buildWeekView({ me: 'A', now: new Date(WED_MID).toISOString(), rows: base }, 'A', WED_MID);
    expect(v0.pending.map((p) => p.id)).toContain('A-yoga');
    const rows = withRows(base, { events: [ev(jst(DAYS[2], '21:00'), 'A', 'workout_edit', { id: 'A-yoga', strength: true })] });
    expect(scoreAt(rows, 'A', LIVE).strengthDays).toEqual([DAYS[1], DAYS[2], DAYS[3]]);
    const v1 = buildWeekView({ me: 'A', now: new Date(WED_MID).toISOString(), rows }, 'A', WED_MID);
    expect(v1.pending.map((p) => p.id)).not.toContain('A-yoga');
  });

  it('excluded removes the workout from scoring (strength day and busy day), and can be undone', () => {
    const rows = withRows(goodWeek(), { events: [ev(jst(DAYS[4], '09:00'), 'A', 'workout_edit', { id: 'A-pil-2', excluded: true })] });
    const sc = scoreAt(rows, 'A', LIVE);
    expect(sc.strengthDays).toEqual([DAYS[1]]);
    expect(sc.restDays).toBe(scoreAt(goodWeek(), 'A', LIVE).restDays + 1);
    const day = dayDetail(reduce(rows), DAYS[3], ms(DAYS[4], '10:00'));
    expect(day.people.A.workouts).toMatchObject([{ id: 'A-pil-2', excluded: true, strength: false }]);
    const back = withRows(rows, { events: [ev(jst(DAYS[4], '09:30'), 'A', 'workout_edit', { id: 'A-pil-2', excluded: false })] });
    expect(scoreAt(back, 'A', LIVE).strengthDays).toEqual([DAYS[1], DAYS[3]]);
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
    expect(s.manualWorkouts.A.map((w) => w.extId)).toEqual(['m:1']);
    expect(scoreAt(rows, 'A', LIVE).strengthDays).toEqual([DAYS[1], DAYS[2], DAYS[3]]);
    expect(dayDetail(s, DAYS[2], WED_MID).people.A.workouts).toMatchObject([{ id: 'm:1', manual: true, strength: true }]);
  });
});

describe('check-ins', () => {
  it('edit:true fixes any day of an open week; without it the 48 h window holds', () => {
    const at = jst(DAYS[6], '20:00');
    const rows = withRows(goodWeek(), {
      events: [
        ev(at, 'A', 'checkin', { date: DAYS[0], habit: 'low_salt_day', done: false, edit: true }),
        ev(at, 'A', 'checkin', { date: DAYS[1], habit: 'low_salt_day', done: false })
      ]
    });
    const sc = scoreAt(rows, 'A', LIVE);
    expect(sc.categories.pear.actual).toBe(20);
    const log = editLog(reduce(rows));
    expect(log).toMatchObject([{ by: 'A', date: DAYS[0], field: 'checkin', subject: 'low_salt_day', before: true, after: false }]);
  });

  it('edit:true on a locked week is refused', () => {
    const rows = withRows(goodWeek(), { events: [ev(new Date(THU_AFTER).toISOString(), 'A', 'checkin', { date: DAYS[0], habit: 'low_salt_day', done: false, edit: true })] });
    expect(reduce(rows).checkins.A.filter((c) => c.edit)).toEqual([]);
  });
});

describe('money', () => {
  // Week 1 pays ¥1,000 per purse on Sunday 19:30; spends follow in week 2.
  const T1 = jst('2026-11-24', '10:00');
  const base = () => withRows(goodWeek(), {
    events: [
      ev(T1, 'A', 'spend', { spendId: 's-cafe', label: 'カフェ', amountYen: 800 }),
      ev(T1, 'A', 'spend', { spendId: 's-big', label: '焼肉', amountYen: 5000 }), // refused: purse is ¥2,000
      ev(T1, 'B', 'spend', { spendId: 's-b', label: '映画', amountYen: 1000 })
    ]
  });

  it('spend_void refunds a paid spend; a refused spend stays refused; only the spender can void', () => {
    const now = ms('2026-11-24', '12:00');
    const rows = withRows(base(), {
      events: [
        ev(jst('2026-11-24', '10:05'), 'A', 'spend_void', { spendId: 's-cafe' }),
        ev(jst('2026-11-24', '10:05'), 'A', 'spend_void', { spendId: 's-big' }),
        ev(jst('2026-11-24', '10:06'), 'A', 'spend_void', { spendId: 's-b' }) // not mine
      ]
    });
    const s = reduce(rows);
    const purse = replayPurse(s, settledWeeks(s, now), now);
    expect(purse.spentYen).toBe(1000);
    expect(Object.fromEntries(purse.log.map((l) => [l.spendId, l.status]))).toEqual({ 's-cafe': 'voided', 's-big': 'refused', 's-b': 'done' });
    expect(purse.log.find((l) => l.spendId === 's-cafe')!.refunded).toBe(true);
    const view = buildWeekView({ me: 'A', now: new Date(now).toISOString(), rows }, 'A', now);
    expect(view.jar.purseYen).toBe(1000);
  });

  it('spend_void cancels a waiting (≥ ¥5,000) spend and a later OK does nothing', () => {
    // Three good weeks (¥6,000 in the purses), so a ¥5,000 ask is accepted and waits for the partner.
    const weeks = [WK, '2026-11-23', '2026-11-30'];
    const rows: SnapshotRows = { metrics: [], workouts: [], presence: [], events: [] };
    for (const wk of weeks) {
      for (const p of ['A', 'B'] as PersonId[]) {
        for (const d of weekDays(wk)) {
          const at = jst(d, '22:00');
          rows.metrics.push(metric(at, p, d, 'steps', 9000), metric(at, p, d, 'exercise_min', 30));
          for (const h of HABITS[p]) rows.events.push(ev(at, p, 'checkin', { date: d, habit: h, done: true }));
        }
        const d1 = weekDays(wk)[1];
        const d3 = weekDays(wk)[3];
        rows.workouts.push(workout(jst(d1, '22:00'), p, `${p}-${d1}`, d1, 'Pilates', 40), workout(jst(d3, '22:00'), p, `${p}-${d3}`, d3, 'Pilates', 40));
      }
    }
    const at = '2026-12-08';
    rows.events.push(
      ev(jst(at, '10:00'), 'A', 'spend', { spendId: 'big', label: '温泉', amountYen: 5000 }),
      ev(jst(at, '10:01'), 'A', 'spend_void', { spendId: 'big' }),
      ev(jst(at, '10:02'), 'B', 'approve', { spendId: 'big' })
    );
    const now = ms(at, '12:00');
    const s = reduce(rows);
    const purse = replayPurse(s, settledWeeks(s, now), now);
    expect(purse.log).toMatchObject([{ spendId: 'big', status: 'voided', refunded: false }]);
    expect(purse.pending).toEqual([]);
    expect(purse.spentYen).toBe(0);
  });

  it('transfer_undo un-ticks a transfer; a new transfer ticks it again (latest wins); weekly yen never change', () => {
    const now = ms('2026-12-02', '12:00');
    const tr = ev(jst('2026-12-01', '10:00'), 'A', 'transfer', { month: '2026-11' });
    const undo = ev(jst('2026-12-01', '10:01'), 'B', 'transfer_undo', { month: '2026-11' });
    const again = ev(jst('2026-12-01', '10:02'), 'A', 'transfer', { month: '2026-11' });
    const v = (events: EventRow[]) => buildWeekView({ me: 'A', now: new Date(now).toISOString(), rows: withRows(goodWeek(), { events }) }, 'A', now);
    expect(v([tr]).jar.transfer?.done).toBe(true);
    expect(v([tr, undo]).jar.transfer?.done).toBe(false);
    expect(v([tr, undo, again]).jar.transfer?.done).toBe(true);
    expect(v([tr, undo]).jar.totalYen).toBe(v([]).jar.totalYen);
    const log = moneyLog(reduce(withRows(goodWeek(), { events: [tr, undo] })), now);
    expect(log.months[0]).toMatchObject({ month: '2026-11', transfer: { done: false } });
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

  it('week list: newest first from the first paid week, both people, 7 stamps, locked and open flags', () => {
    const now = ms('2026-11-24', '12:00'); // Tuesday of the next week: WK is settled but still open
    const weeks = historyWeeks(reduce(rows), now);
    expect(weeks.map((w) => w.weekKey)).toEqual(['2026-11-23', '2026-11-16', '2026-11-09', '2026-11-02']);
    const w = weeks[1];
    expect(w).toMatchObject({ settled: true, locked: false, open: true, current: false });
    expect(w.people.A.stamps).toEqual(['active', 'strength', 'active', 'strength', 'active', 'active', 'active']);
    expect(weeks[0].people.A.stamps.slice(2)).toEqual(['future', 'future', 'future', 'future', 'future']);
    const locked = historyWeeks(reduce(rows), THU_AFTER)[1];
    expect(locked).toMatchObject({ weekKey: WK, locked: true, open: false, estimate: false });
  });

  it('week detail and day detail show both people, the source of minutes and the change log', () => {
    const s = reduce(rows);
    const wd = weekDetail(s, WK, WED_MID);
    expect(wd.open).toBe(true);
    expect(wd.people.A.days[0]).toMatchObject({ steps: 7000, edited: true, minutes: 30, minutesSource: 'watch' });
    expect(wd.people.B.days[0]).toMatchObject({ minutes: 45, minutesSource: 'edit', edited: true });
    expect(wd.people.A.days[4].future).toBe(true);
    const dd = dayDetail(s, DAYS[0], WED_MID);
    expect(dd.people.A.steps).toEqual({ value: 7000, edited: true });
    expect(dd.people.B.minutes).toMatchObject({ value: 45, source: 'edit', edited: true });
    expect(dd.edits.map((e) => e.by)).toEqual(['B', 'A']);
    expect(dd.people.A.workouts).toEqual([]);
    expect(dayDetail(s, DAYS[1], WED_MID).people.A.workouts).toMatchObject([{ id: 'A-pil-1', type: 'Pilates', strength: true, excluded: false }]);
    expect(dayDetail(s, DAYS[0], THU_AFTER)).toMatchObject({ open: false, locked: true });
  });
});

describe('round 7: manual workouts, lock boundaries, no-op edits', () => {
  const LOCK = ms('2026-11-25', '04:00');
  const add = (at: string, date: string, min: number, id = `m:add-${++n}`) => ev(at, 'A', 'workout_add', { id, date, type: 'Pilates', durationMin: min });

  it('a hand-added workout counts toward 活動 as max(Watch, steps, manual), never summed, within the daily cap', () => {
    const base = goodWeek(); // 30 Watch minutes a day, 9000 steps (goal well below: steps also give minutes)
    const s0 = reduce(base);
    const d0 = dayDetail(s0, DAYS[0], WED_MID).people.A.minutes.value;
    // A shorter manual workout than the day's minutes changes nothing (no double counting).
    const small = withRows(base, { events: [add(jst(DAYS[2], '23:00'), DAYS[0], Math.max(10, d0 - 5))] });
    expect(scoreAt(small, 'A', LIVE).categories.peach.actual).toBe(scoreAt(base, 'A', LIVE).categories.peach.actual);
    // A longer one replaces the day's minutes, capped like any day.
    const big = withRows(base, { events: [add(jst(DAYS[2], '23:00'), DAYS[0], d0 + 20)] });
    const raised = scoreAt(big, 'A', LIVE).categories.peach.actual - scoreAt(base, 'A', LIVE).categories.peach.actual;
    expect(raised).toBeGreaterThan(0);
    expect(raised).toBeLessThanOrEqual(20);
    const dd = dayDetail(reduce(big), DAYS[0], WED_MID).people.A.minutes;
    expect(dd).toMatchObject({ value: d0 + 20, source: 'manual' });
    expect(weekDetail(reduce(big), WK, WED_MID).people.A.days[0]).toMatchObject({ minutesSource: 'manual', editedFields: ['workout'] });
  });

  it('two manual workouts on a day add up with each other (but still only against the larger source)', () => {
    const rows: SnapshotRows = { metrics: [], workouts: [], presence: [], events: [add(jst(DAYS[1], '20:00'), DAYS[1], 25), add(jst(DAYS[1], '21:00'), DAYS[1], 20)] };
    expect(dayDetail(reduce(rows), DAYS[1], WED_MID).people.A.minutes).toMatchObject({ value: 45, source: 'manual' });
    expect(scoreAt(rows, 'A', LIVE).categories.peach.actual).toBe(45);
  });

  it('an excluded manual workout stops counting', () => {
    const id = 'm:x1';
    const rows: SnapshotRows = { metrics: [], workouts: [], presence: [], events: [add(jst(DAYS[1], '20:00'), DAYS[1], 40, id), ev(jst(DAYS[1], '21:00'), 'A', 'workout_edit', { id, excluded: true })] };
    expect(scoreAt(rows, 'A', LIVE).categories.peach.actual).toBe(0);
  });

  it('an edit exactly at the lock is refused; one millisecond before counts', () => {
    const set = (at: number) => ['', 'A', `e${++n}`, 'metric_set', JSON.stringify({ date: DAYS[0], metric: 'steps', value: 1234 })] as EventRow;
    const at = (t: number) => { const r = set(t); r[0] = new Date(t).toISOString(); return r; };
    expect(metricAsOf(reduce(withRows(goodWeek(), { events: [at(LOCK)] })), 'A', DAYS[0], 'steps', LIVE)).toBe(9000);
    expect(metricAsOf(reduce(withRows(goodWeek(), { events: [at(LOCK - 1)] })), 'A', DAYS[0], 'steps', LIVE)).toBe(1234);
    const fix = (t: number) => ev(new Date(t).toISOString(), 'A', 'checkin', { date: DAYS[6], habit: HABITS.A[0], done: false, edit: true });
    expect(reduce(withRows(goodWeek(), { events: [fix(LOCK)] })).checkins.A.filter((c) => c.edit)).toEqual([]);
    expect(reduce(withRows(goodWeek(), { events: [fix(LOCK - 1)] })).checkins.A.filter((c) => c.edit)).toHaveLength(1);
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
