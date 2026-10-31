// きろく's views and the event rules around them (docs/design.md#kiroku). Read-only: Apple Health is the source of
// truth, so the only data is the Shortcut's rows; the goals (`pref` moveGoal / goalWeight) may be set for either
// person (`data.person`). Rows of event types since removed (`metric_set`, `workout_add`, `workout_edit`) are ignored.
import { describe, expect, it } from 'vitest';
import type { EventRow, MetricRow, SnapshotRows } from '#lib/contract/api.ts';
import type { PersonId } from '#lib/types.ts';
import { weekDays } from '#lib/time/dates.ts';
import { moveGoalOn, reduce } from './state.ts';
import { buildWeekView } from './week.ts';
import { metricAsOf } from './inputs.ts';
import { weekBells } from './bells.ts';
import { bellsLedger, dayDetail, historyWeeks, weekDetail } from './history.ts';

// A week of the economy: Sunday 19:30 = 11-22, the lock = Wednesday 11-25 04:00 JST.
const WK = '2026-11-16';
const DAYS = weekDays(WK);
const jst = (date: string, hm: string) => new Date(`${date}T${hm}:00+09:00`).toISOString();
const ms = (date: string, hm: string) => Date.parse(jst(date, hm));

let n = 0;
const ev = (at: string, person: PersonId, type: string, data: object): EventRow => [at, person, `e${++n}`, type as EventRow[3], JSON.stringify(data)];
const metric = (at: string, person: PersonId, date: string, m: MetricRow[3], v: number): MetricRow => [at, person, date, m, v];

/** A good week for both: steps, 30 exercise minutes, Move, Stand. */
function goodWeek(): SnapshotRows {
  const rows: SnapshotRows = { metrics: [], events: [] };
  for (const p of ['A', 'B'] as PersonId[]) {
    for (const d of DAYS) {
      const at = jst(d, '22:00');
      rows.metrics.push(
        metric(at, p, d, 'steps', 9000), metric(at, p, d, 'exercise_min', 30), metric(at, p, d, 'move_kcal', 500), metric(at, p, d, 'stand_min', 150)
      );
    }
  }
  return rows;
}

const withRows = (base: SnapshotRows, add: Partial<SnapshotRows>): SnapshotRows => ({
  metrics: [...base.metrics, ...(add.metrics ?? [])],
  events: [...base.events, ...(add.events ?? [])]
});

const LIVE = Infinity;
const WED_MID = ms(DAYS[2], '23:30'); // mid-week, open
const THU_AFTER = ms('2026-11-26', '12:00'); // locked

describe('Apple Health is the source of truth', () => {
  it('rows of the removed edit events (metric_set, workout_add, workout_edit) are ignored, without a crash', () => {
    const rows = withRows(goodWeek(), {
      events: [
        ev(jst(DAYS[2], '09:00'), 'B', 'metric_set', { date: DAYS[0], metric: 'exercise_min', value: 60 }),
        ev(jst(DAYS[2], '09:01'), 'A', 'metric_set', { person: 'B', date: DAYS[1], metric: 'weight', value: 61.2 }),
        ev(jst(DAYS[2], '09:02'), 'B', 'workout_add', { id: 'm:1', date: DAYS[2], type: 'Pilates', durationMin: 70 }),
        ev(jst(DAYS[2], '09:03'), 'B', 'workout_edit', { id: 'm:1', excluded: true }),
        ev(jst(DAYS[2], '09:04'), 'B', 'no_such_type', {})
      ]
    });
    const s = reduce(rows);
    expect(metricAsOf(s, 'B', DAYS[0], 'exercise_min', LIVE)).toBe(30);
    expect(s.weights.B.size).toBe(0);
    expect(weekBells(s, WK, WED_MID)).toEqual(weekBells(reduce(goodWeek()), WK, WED_MID));
    expect(bellsLedger(s, THU_AFTER)).toEqual(bellsLedger(reduce(goodWeek()), THU_AFTER));
  });

  it('a day’s metric is its latest Shortcut row so far (a lower re-sync replaces a higher one)', () => {
    const rows = withRows(goodWeek(), {
      metrics: [metric(jst(DAYS[0], '23:00'), 'A', DAYS[0], 'steps', 18000), metric(jst(DAYS[1], '08:00'), 'A', DAYS[0], 'steps', 9500)]
    });
    const s = reduce(rows);
    expect(metricAsOf(s, 'A', DAYS[0], 'steps', LIVE)).toBe(9500);
    expect(metricAsOf(s, 'A', DAYS[0], 'steps', ms(DAYS[0], '23:30'))).toBe(18000);
    expect(metricAsOf(s, 'A', DAYS[0], 'steps', ms(DAYS[0], '22:30'))).toBe(9000);
    expect(metricAsOf(s, 'A', DAYS[1], 'steps', ms(DAYS[0], '22:30'))).toBeNull();
    // the open week earns on the corrected value
    expect(weekBells(s, WK, WED_MID).A.days[0].steps).toBe(9500);
  });

  it('late Health data after the Wednesday 04:00 lock never changes the week (its earnings are final)', () => {
    const late = new Date(THU_AFTER - 1000).toISOString();
    const rows = withRows(goodWeek(), { metrics: [metric(late, 'A', DAYS[0], 'exercise_min', 60), metric(late, 'A', DAYS[1], 'move_kcal', 900)] });
    expect(weekBells(reduce(rows), WK, THU_AFTER)).toEqual(weekBells(reduce(goodWeek()), WK, THU_AFTER));
    // before the lock the same rows count
    const early = new Date(ms('2026-11-24', '12:00')).toISOString();
    const open = withRows(goodWeek(), { metrics: [metric(early, 'A', DAYS[0], 'exercise_min', 60)] });
    expect(weekBells(reduce(open), WK, THU_AFTER).A.days[0].exerciseMin).toBe(60);
  });

  it('a locked week stays frozen when a later sync lowers a day: it reads the latest row as of the lock', () => {
    const inflated = withRows(goodWeek(), { metrics: [metric(jst(DAYS[0], '23:00'), 'A', DAYS[0], 'steps', 26072)] });
    const frozen = weekBells(reduce(inflated), WK, THU_AFTER);
    expect(frozen.A.days[0].steps).toBe(26072);
    // a 31-day re-sync after the lock corrects the day to Health's total: the locked week's earnings don't move
    const late = jst('2026-11-30', '09:00');
    const corrected = withRows(inflated, { metrics: [metric(late, 'A', DAYS[0], 'steps', 13172), metric(late, 'A', DAYS[1], 'exercise_min', 0)] });
    const after = ms('2026-11-30', '12:00');
    expect(weekBells(reduce(corrected), WK, after)).toEqual(weekBells(reduce(inflated), WK, after));
    expect(weekBells(reduce(corrected), WK, after).A.days[0].steps).toBe(26072);
    // the same correction before the lock counts
    const early = withRows(inflated, { metrics: [metric(jst('2026-11-24', '09:00'), 'A', DAYS[0], 'steps', 13172)] });
    expect(weekBells(reduce(early), WK, THU_AFTER).A.days[0].steps).toBe(13172);
  });
});

describe('goals: either person sets either person’s', () => {
  it('`person` on moveGoal / goalWeight names whose goal; without it, the sender’s', () => {
    const rows = withRows(goodWeek(), {
      events: [
        ev(jst(DAYS[2], '09:07'), 'B', 'pref', { person: 'A', key: 'moveGoal', value: 450 }),
        ev(jst(DAYS[2], '09:08'), 'B', 'pref', { person: 'A', key: 'goalWeight', value: 58.5 }),
        ev(jst(DAYS[2], '09:09'), 'B', 'pref', { key: 'goalWeight', value: 52 })
      ]
    });
    const s = reduce(rows);
    expect(moveGoalOn(s, 'A', DAYS[2])).toBe(450);
    expect(moveGoalOn(s, 'A', DAYS[1])).toBe(600); // never re-prices earlier days
    expect(moveGoalOn(s, 'B', DAYS[2])).toBe(400);
    expect(s.prefs.A.goalWeight).toBe(58.5);
    expect(s.prefs.B.goalWeight).toBe(52);
    expect(dayDetail(s, DAYS[2], WED_MID).people.A.move).toEqual({ value: 500, goal: 450 });
  });

  it('`person` anywhere else, or a bad one, ignores the event (the script refuses it too)', () => {
    const rows = withRows(goodWeek(), {
      events: [
        ev(jst(DAYS[2], '09:00'), 'B', 'pref', { person: 'A', key: 'villagerName', value: 'X' }),
        ev(jst(DAYS[2], '09:01'), 'B', 'pref', { person: 'C', key: 'moveGoal', value: 450 }),
        ev(jst(DAYS[2], '09:02'), 'B', 'spend', { person: 'A', spendId: 's1', item: 'snack', label: 'おやつ', bells: 100 })
      ]
    });
    const s = reduce(rows);
    expect(s.prefs.A.villagerName).toBeUndefined();
    expect(s.prefs.B.villagerName).toBeUndefined();
    expect(s.moveGoals.A.length + s.moveGoals.B.length).toBe(0);
    expect(s.bellSpends).toEqual([]);
  });
});

describe('history views', () => {
  const rows = withRows(goodWeek(), { metrics: [metric(jst(DAYS[0], '23:00'), 'B', DAYS[0], 'exercise_min', 45)] });

  it('week list: newest first from the economy’s first week, both people, harvested flag', () => {
    const now = ms('2026-11-24', '12:00'); // Tuesday of the next week: WK's harvest opened
    const weeks = historyWeeks(reduce(rows), now);
    expect(weeks.map((w) => w.weekKey)).toEqual(['2026-11-23', '2026-11-16', '2026-11-09', '2026-11-02', '2026-10-26']); // the economy starts 2026-10-26
    expect(weeks[1]).toMatchObject({ current: false, harvested: false });
    expect(weeks[1].people.A.ringWeek).toEqual({ peach: { days: 0, goal: 5 }, pear: { days: 0, goal: 5 }, cherry: { days: 7, goal: 5 }, apple: { days: 7, goal: 4 } });
  });

  it('week detail and day detail show both people’s four fruits and their ベル', () => {
    const s = reduce(rows);
    const wd = weekDetail(s, WK, WED_MID);
    expect(wd.people.A.days[0]).toMatchObject({ steps: 9000, exerciseMin: 30, moveKcal: 500, standMin: 150 });
    expect(wd.people.B.days[0]).toMatchObject({ exerciseMin: 45 });
    expect(wd.people.A.days[4].future).toBe(true);
    const dd = dayDetail(s, DAYS[1], WED_MID);
    expect(dd.people.A).toMatchObject({ steps: 9000, exerciseMin: 30, move: { value: 500, goal: 600 }, standMin: 150 });
    expect(dd.people.A.rings).toMatchObject({ pear: 98, cherry: 120 }); // 500 / 600 is past 75% (v2 milestones: 98); 150 stand min, capped at 120
    expect(dd.people.A.bells).toBe(Object.values(dd.people.A.rings).reduce((a, b) => a + b, 0));
    // a future day earns nothing yet, whatever rows are dated to it
    expect(dayDetail(s, DAYS[5], WED_MID).people.A.bells).toBe(0);
  });
});

describe('harvest taps (one acceptance rule for the island and きろく)', () => {
  const SUN = DAYS[6];
  const harvest = (at: string, person: PersonId, week = WK) => ev(at, person, 'harvest', { week });
  const view = (rows: SnapshotRows, me: PersonId, t: number) => buildWeekView(reduce(rows), me, t);
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

  it('a tap before the harvest opened does not count anywhere', () => {
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
