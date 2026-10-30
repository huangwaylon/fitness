// reduce: one block per event type, accepted vs ignored (the read-time rules that replace the old server's refusals).
import { describe, expect, it } from 'vitest';
import { reduce } from './state.ts';
import type { EventRow, PresenceRow, SnapshotRows, WorkoutRow } from '#lib/contract/api.ts';
import type { PersonId } from '#lib/types.ts';

const WK = '2026-11-09'; // a paid week: open until Wed 2026-11-18 04:00 JST
const at = (date: string, hm = '12:00') => new Date(`${date}T${hm}:00+09:00`).toISOString();
const LOCKED = at('2026-11-18', '04:00');
let n = 0;
const ev = (when: string, person: PersonId, type: string, data: object | string): EventRow =>
  [when, person, `e${++n}`, type as EventRow[3], typeof data === 'string' ? data : JSON.stringify(data)];
const rows = (events: EventRow[], more: Partial<SnapshotRows> = {}): SnapshotRows => ({ metrics: [], workouts: [], presence: [], events, ...more });
const workout = (person: PersonId, id: string, date: string, when = at(date, '20:00')): WorkoutRow =>
  [when, person, id, date, 'Yoga', at(date, '07:00'), at(date, '07:30'), 30, null];

describe('reduce: rows', () => {
  it('skips rows with an unreadable at or person, and bad metric rows', () => {
    const s = reduce({
      metrics: [[at(WK), 'A', WK, 'steps', 100], ['nope', 'A', WK, 'steps', 1], [at(WK), 'C' as PersonId, WK, 'steps', 1],
        [at(WK), 'A', WK, 'floors' as 'steps', 1], [at(WK), 'A', WK, 'steps', 'x' as unknown as number]],
      workouts: [], presence: [], events: []
    });
    expect([...s.metrics.A.values()].flat().map((r) => r.v)).toEqual([100]);
    expect(s.metrics.B.size).toBe(0);
    expect(s.lastSync).toEqual({ A: at(WK), B: null });
  });

  it('workouts: the first row per id wins; presence: own places only, no duplicates, no skewed event_at', () => {
    const p = (when: string, person: PersonId, place: string, event: string, eventAt = when) => [when, person, place, event, eventAt] as PresenceRow;
    const s = reduce(rows([], {
      workouts: [workout('A', 'w1', WK), workout('A', 'w1', WK, at(WK, '21:00'))],
      presence: [p(at(WK, '18:00'), 'A', 'anytime', 'arrive'), p(at(WK, '18:01'), 'A', 'anytime', 'arrive'),
        p(at(WK, '18:00'), 'A', 'pt_studio', 'arrive'), p(at(WK, '19:00'), 'A', 'anytime', 'leave')]
    }));
    expect(s.workouts.A.map((w) => w.at)).toEqual([at(WK, '20:00')].map(Date.parse));
    // Arrivals only: a row with another event (a hand edit) is malformed and skipped.
    expect(s.presence.A.map((e) => `${e.placeKey}@${e.eventAt}`)).toEqual([`anytime@${new Date(at(WK, '18:00')).toISOString()}`]);
  });
});

describe('reduce: events', () => {
  it('move_kcal and stand_min rows are activity metrics (ADR 0021); metric_set accepts them within bounds', () => {
    const s = reduce(rows([
      ev(at('2026-11-10'), 'A', 'metric_set', { date: WK, metric: 'move_kcal', value: 450 }),
      ev(at('2026-11-10'), 'A', 'metric_set', { date: WK, metric: 'move_kcal', value: 10_001 }),
      ev(at('2026-11-10'), 'A', 'metric_set', { date: WK, metric: 'stand_min', value: 1_440 }),
      ev(at('2026-11-10'), 'A', 'metric_set', { date: WK, metric: 'stand_min', value: 1_441 })
    ], { metrics: [[at(WK, '22:00'), 'B', WK, 'move_kcal', 512.5], [at(WK, '22:00'), 'B', WK, 'stand_min', 58]] }));
    expect([...s.metrics.B.entries()].map(([k, l]) => [k, l.map((x) => x.v)])).toEqual([[`${WK}|move_kcal`, [512.5]], [`${WK}|stand_min`, [58]]]);
    expect([...s.metricSets.A.entries()].map(([k, l]) => [k, l.map((x) => x.v)])).toEqual([[`${WK}|move_kcal`, [450]], [`${WK}|stand_min`, [1440]]]);
  });

  it('pref moveGoal: an integer kcal in 100–2,000 per person, in at order; anything else is ignored', () => {
    const goal = (when: string, person: PersonId, value: unknown) => ev(when, person, 'pref', { key: 'moveGoal', value });
    const s = reduce(rows([
      goal(at(WK, '09:00'), 'A', 700),
      goal(at(WK, '10:00'), 'A', 99), goal(at(WK, '10:00'), 'A', 2001), goal(at(WK, '10:00'), 'A', 550.5),
      goal(at(WK, '10:00'), 'A', '500'), goal(at(WK, '10:00'), 'A', null),
      goal(at(WK, '11:00'), 'A', 100), goal(at(WK, '12:00'), 'B', 2000)
    ]));
    expect(s.moveGoals.A.map((x) => x.v)).toEqual([700, 100]);
    expect(s.moveGoals.B.map((x) => x.v)).toEqual([2000]);
    expect(s.prefs).toEqual({ A: {}, B: {} });
  });

  it('spend and spend_void: ベル spends only, first id wins, only the spender voids, once', () => {
    const bell = (spendId: unknown, extra: object = {}) => ({ spendId, pot: 'treat', item: 'cake', label: ' ケーキ ', bells: 800, ...extra });
    const s = reduce(rows([
      ev(at(WK), 'B', 'spend', bell(7)),
      ev(at(WK), 'B', 'spend', bell(7, { label: 'dup', bells: 1 })),
      ev(at(WK), 'B', 'spend', bell('x', { label: '' })),
      ev(at(WK), 'B', 'spend', bell('y', { bells: 1.5 })),
      ev(at(WK), 'B', 'spend', bell('z', { bells: 10_000_001 })),
      ev(at(WK), 'B', 'spend', bell('p', { pot: 'jar' })),
      ev(at(WK), 'B', 'spend', { spendId: 'nopot', label: 'ケーキ', bells: 800 }), // no pot
      ev(at(WK, '13:00'), 'A', 'spend_void', { spendId: 7 }), // not the spender
      ev(at(WK, '13:00'), 'B', 'spend_void', { spendId: 'nopot' }), // not an accepted spend
      ev(at(WK, '13:00'), 'B', 'spend_void', { spendId: 7 }),
      ev(at(WK, '14:00'), 'B', 'spend_void', { spendId: 7 }) // twice
    ]));
    expect(s.bellSpends).toEqual([{ at: Date.parse(at(WK)), person: 'B', spendId: '7', pot: 'treat', item: 'cake', label: 'ケーキ', bells: 800 }]);
    expect(s.spendVoids.map((v) => [v.person, v.at])).toEqual([['B', Date.parse(at(WK, '13:00'))]]);
  });

  it('a row of a type the server refuses (a hand edit of the sheet) is ignored, not a crash', () => {
    const odd = [ev(at('2026-12-02'), 'A', 'nonsense', { x: 1 }), ev(at('2026-12-02'), 'B', 'spend', { spendId: 'y', label: 'x', amount: 5 })];
    const tick = ev(at('2026-12-03'), 'B', 'highfive', {});
    const a = reduce(rows([...odd, tick]));
    const b = reduce(rows([tick]));
    expect(a.highfives).toHaveLength(1);
    expect({ ...a, ats: [] }).toEqual({ ...b, ats: [] }); // only the row counts differ
  });

  it('metric_set: integer within bounds, a day that has happened, in an open week', () => {
    const s = reduce(rows([
      ev(at('2026-11-10'), 'A', 'metric_set', { date: WK, metric: 'steps', value: 5000 }),
      ev(at('2026-11-10'), 'A', 'metric_set', { date: WK, metric: 'steps', value: 100_001 }),
      ev(at('2026-11-10'), 'A', 'metric_set', { date: WK, metric: 'exercise_min', value: 1.5 }),
      ev(at('2026-11-10'), 'A', 'metric_set', { date: '2026-11-12', metric: 'steps', value: 1 }), // future day
      ev(LOCKED, 'A', 'metric_set', { date: WK, metric: 'steps', value: 1 }), // locked
      ev(at('2026-11-10'), 'A', 'metric_set', { date: WK, metric: 'floors', value: 1 })
    ]));
    expect([...s.metricSets.A.entries()].map(([k, l]) => [k, l.map((x) => x.v)])).toEqual([[`${WK}|steps`, [5000]]]);
  });

  it('workout_edit: own synced workout, open week, at least one field', () => {
    const s = reduce(rows([
      ev(at(WK, '21:00'), 'A', 'workout_edit', { id: 'w1', strength: true }),
      ev(at(WK, '21:00'), 'A', 'workout_edit', { id: 'w1', excluded: true, strength: null }),
      ev(at(WK, '21:00'), 'A', 'workout_edit', { id: 'w1' }),
      ev(at(WK, '21:00'), 'B', 'workout_edit', { id: 'w1', strength: true }),
      ev(LOCKED, 'A', 'workout_edit', { id: 'w1', strength: false })
    ], { workouts: [workout('A', 'w1', WK)] }));
    expect(s.workoutEdits.map(({ person, id, strength, excluded }) => ({ person, id, strength, excluded }))).toEqual([
      { person: 'A', id: 'w1', strength: true, excluded: undefined }, { person: 'A', id: 'w1', strength: null, excluded: true }
    ]);
    expect(s.workoutStrength.get('A|w1')!.map((x) => x.v)).toEqual([true, null]);
    expect(s.workoutExcluded.get('A|w1')!.map((x) => x.v)).toEqual([true]);
  });

  it('workout_add: m: id, a known type, 1–600 minutes, open week, first id wins; strength becomes an edit', () => {
    const add = (when: string, d: object) => ev(when, 'A', 'workout_add', { date: WK, type: 'Yoga', durationMin: 30, ...d });
    const s = reduce(rows([
      add(at(WK, '21:00'), { id: 'm:1', strength: true }),
      add(at(WK, '21:00'), { id: 'm:1', durationMin: 10 }),
      add(at(WK, '21:00'), { id: 'w:1' }),
      add(at(WK, '21:00'), { id: 'm:2', type: 'Juggling' }),
      add(at(WK, '21:00'), { id: 'm:3', durationMin: 601 }),
      add(LOCKED, { id: 'm:4' })
    ]));
    expect(s.manualWorkouts.A.map((w) => [w.id, w.durationMin, w.startAt, w.manual])).toEqual([['m:1', 30, `${WK}T12:00:00+09:00`, true]]);
    expect(s.workoutEdits).toEqual([{ at: Date.parse(at(WK, '21:00')), person: 'A', id: 'm:1', strength: true }]);
  });

  it('harvest, highfive and pref', () => {
    const s = reduce(rows([
      ev(at('2026-11-15', '20:00'), 'A', 'harvest', { week: WK }),
      ev(at('2026-11-15', '20:00'), 'A', 'harvest', { week: 'soon' }),
      ev(at(WK), 'B', 'highfive', {}),
      ev(at(WK), 'A', 'pref', { key: 'locale', value: 'en' }),
      ev(at(WK), 'A', 'pref', { key: 'locale', value: 'fr' }),
      ev(at(WK), 'A', 'pref', { key: 'villagerName', value: '  ウェイ  ' }),
      ev(at(WK), 'B', 'pref', { key: 'villagerName', value: 'x'.repeat(21) }),
      ev(at(WK), 'B', 'pref', { key: 'villager', value: 'Bad-Id' }),
      ev(at(WK), 'B', 'pref', { key: 'villager', value: 'ume' })
    ]));
    expect(s.harvests.map((h) => h.week)).toEqual([WK]);
    expect(s.highfives.map((h) => h.person)).toEqual(['B']);
    expect(s.prefs).toEqual({ A: { locale: 'en', villagerName: 'ウェイ' }, B: { villager: 'ume' } });
  });

  it('unknown types and unreadable data are ignored; events apply in at order', () => {
    const s = reduce(rows([
      ev(at(WK, '13:00'), 'A', 'pref', { key: 'locale', value: 'ja' }),
      ev(at(WK, '12:00'), 'A', 'pref', { key: 'locale', value: 'en' }),
      ev(at(WK), 'A', 'nonsense', { metric: 'steps', on: true }),
      ev(at(WK), 'A', 'highfive', '{oops')
    ]));
    expect(s.prefs.A.locale).toBe('ja');
    expect(s.highfives).toEqual([]);
  });
});
