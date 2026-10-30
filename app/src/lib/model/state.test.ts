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
    const p = (when: string, person: PersonId, place: string, event: 'arrive' | 'leave', eventAt = when): PresenceRow => [when, person, place, event, eventAt];
    const s = reduce(rows([], {
      workouts: [workout('A', 'w1', WK), workout('A', 'w1', WK, at(WK, '21:00'))],
      presence: [p(at(WK, '18:00'), 'A', 'anytime', 'arrive'), p(at(WK, '18:01'), 'A', 'anytime', 'arrive'),
        p(at(WK, '18:00'), 'A', 'pt_studio', 'arrive'), p(at(WK, '19:00'), 'A', 'anytime', 'leave')]
    }));
    expect(s.workouts.A.map((w) => w.at)).toEqual([at(WK, '20:00')].map(Date.parse));
    // Arrivals only: the leave row (old Shortcuts) is ignored.
    expect(s.presence.A.map((e) => `${e.placeKey}@${e.eventAt}`)).toEqual([`anytime@${new Date(at(WK, '18:00')).toISOString()}`]);
  });
});

describe('reduce: events', () => {
  it('checkin: own habits, today and two days back, not after the lock; edits any day of an open week', () => {
    const tue = '2026-11-10';
    const s = reduce(rows([
      ev(at(tue), 'A', 'checkin', { date: tue, habit: 'protein_each_meal', done: true }),
      ev(at(tue), 'A', 'checkin', { date: '2026-11-08', habit: 'protein_each_meal', done: true }), // 2 days back: ok
      ev(at(tue), 'A', 'checkin', { date: '2026-11-07', habit: 'protein_each_meal', done: true }), // 3 days back
      ev(at(tue), 'A', 'checkin', { date: '2026-11-11', habit: 'protein_each_meal', done: true }), // tomorrow
      ev(at(tue), 'A', 'checkin', { date: tue, habit: 'not_a_habit', done: true }), // not a habit
      ev(at(tue), 'A', 'checkin', { date: tue, habit: 'protein_each_meal', done: 'yes' }),
      ev(at('2026-11-16'), 'A', 'checkin', { date: '2026-11-14', habit: 'veg_two_meals', done: true, edit: true }), // open week
      ev(at('2026-11-21'), 'A', 'checkin', { date: '2026-11-14', habit: 'veg_two_meals', done: false, edit: true }) // locked
    ]));
    expect(s.checkins.A.map((c) => `${c.date}:${c.habit}:${c.edit ?? false}`)).toEqual([
      `${tue}:protein_each_meal:false`, '2026-11-08:protein_each_meal:false', '2026-11-14:veg_two_meals:true'
    ]);
  });

  it('confirm: own workout, after it arrived, before its week locks; an old visit answer is ignored', () => {
    const s = reduce(rows([
      ev(at(WK, '21:00'), 'A', 'confirm', { kind: 'workout', id: 'w1', yes: true }),
      ev(at(WK, '21:00'), 'B', 'confirm', { kind: 'workout', id: 'w1', yes: true }), // not B's
      ev(at(WK, '19:00'), 'A', 'confirm', { kind: 'workout', id: 'w2', yes: true }), // before the row arrived
      ev(LOCKED, 'A', 'confirm', { kind: 'workout', id: 'w2', yes: false }), // locked
      ev(at(WK, '21:00'), 'A', 'confirm', { kind: 'visit', id: `anytime@${at(WK, '18:00')}`, yes: true }),
      ev(at(WK, '21:00'), 'A', 'confirm', { kind: 'workout', id: 'w1', yes: 'y' })
    ], {
      workouts: [workout('A', 'w1', WK), workout('A', 'w2', WK)],
      presence: [[at(WK, '18:00'), 'A', 'anytime', 'arrive', at(WK, '18:00')]]
    }));
    expect([...s.workoutConfirms.keys()]).toEqual(['A|w1']);
    expect([...s.workoutConfirms.values()].flat()).toHaveLength(1);
    expect(s.presence.A).toHaveLength(1);
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
      ev(at(WK), 'B', 'spend', { spendId: 'yen', label: 'ケーキ', amountYen: 800 }), // the old yen economy: ignored
      ev(at(WK, '13:00'), 'A', 'spend_void', { spendId: 7 }), // not the spender
      ev(at(WK, '13:00'), 'B', 'spend_void', { spendId: 'yen' }), // not a ベル spend
      ev(at(WK, '13:00'), 'B', 'spend_void', { spendId: 7 }),
      ev(at(WK, '14:00'), 'B', 'spend_void', { spendId: 7 }) // twice
    ]));
    expect(s.bellSpends).toEqual([{ at: Date.parse(at(WK)), person: 'B', spendId: '7', pot: 'treat', item: 'cake', label: 'ケーキ', bells: 800 }]);
    expect(s.spendVoids.map((v) => [v.person, v.at])).toEqual([['B', Date.parse(at(WK, '13:00'))]]);
  });

  it('rows of the removed approve, transfer and transfer_undo types are read and ignored, not a crash', () => {
    const old = [
      ev(at('2026-12-02'), 'A', 'approve', { spendId: 7 }),
      ev(at('2026-12-02'), 'A', 'transfer', { month: '2026-11' }),
      ev(at('2026-12-03'), 'B', 'transfer_undo', { month: '2026-11' })
    ];
    const tick = ev(at('2026-12-03'), 'B', 'highfive', {});
    const a = reduce(rows([...old, tick]));
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

  it('unknown types (old share rows) and unreadable data are ignored; events apply in at order', () => {
    const s = reduce(rows([
      ev(at(WK, '13:00'), 'A', 'pref', { key: 'locale', value: 'ja' }),
      ev(at(WK, '12:00'), 'A', 'pref', { key: 'locale', value: 'en' }),
      ev(at(WK), 'A', 'share', { metric: 'steps', on: true }),
      ev(at(WK), 'A', 'highfive', '{oops')
    ]));
    expect(s.prefs.A.locale).toBe('ja');
    expect(s.highfives).toEqual([]);
  });
});
