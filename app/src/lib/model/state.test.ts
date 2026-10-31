// reduce: one block per event type, accepted vs ignored (the read-time rules that replace the old server's refusals).
import { describe, expect, it } from 'vitest';
import { reduce } from './state.ts';
import { ROSTER_IDS } from '#lib/villagers/roster.ts';
import type { EventRow, SnapshotRows } from '#lib/contract/api.ts';
import type { PersonId } from '#lib/types.ts';

const WK = '2026-11-09'; // a paid week
const at = (date: string, hm = '12:00') => new Date(`${date}T${hm}:00+09:00`).toISOString();
let n = 0;
const ev = (when: string, person: PersonId, type: string, data: object | string): EventRow =>
  [when, person, `e${++n}`, type as EventRow[3], typeof data === 'string' ? data : JSON.stringify(data)];
const rows = (events: EventRow[], more: Partial<SnapshotRows> = {}): SnapshotRows => ({ metrics: [], events, ...more });

describe('reduce: rows', () => {
  it('skips rows with an unreadable at or person, and bad metric rows', () => {
    const s = reduce({
      metrics: [[at(WK), 'A', WK, 'steps', 100], ['nope', 'A', WK, 'steps', 1], [at(WK), 'C' as PersonId, WK, 'steps', 1],
        [at(WK), 'A', WK, 'floors' as 'steps', 1], [at(WK), 'A', WK, 'steps', 'x' as unknown as number]],
      events: []
    });
    expect([...s.metrics.A.values()].flatMap((day) => Object.values(day).flat()).map((r) => r.v)).toEqual([100]);
    expect(s.metrics.B.size).toBe(0);
    expect(s.lastSync).toEqual({ A: at(WK), B: null });
  });

  it('tabs the model doesn’t read (old `workouts` and `presence` rows still in the sheet) are ignored', () => {
    const old = {
      workouts: [[at(WK, '20:00'), 'A', 'w1', WK, 'Yoga', at(WK, '07:00'), at(WK, '07:30'), 30, null]],
      presence: [[at(WK, '18:00'), 'A', 'エニタイム', at(WK, '18:00')]]
    };
    const s = reduce({ ...rows([]), ...old } as SnapshotRows);
    expect({ ...s, ats: [] }).toEqual({ ...reduce(rows([])), ats: [] });
  });
});

describe('reduce: events', () => {
  it('move_kcal and stand_min rows are activity metrics', () => {
    const s = reduce(rows([], { metrics: [[at(WK, '22:00'), 'B', WK, 'move_kcal', 512.5], [at(WK, '22:00'), 'B', WK, 'stand_min', 58]] }));
    expect(s.metrics.B.get(WK)).toEqual({ move_kcal: [{ at: Date.parse(at(WK, '22:00')), v: 512.5 }], stand_min: [{ at: Date.parse(at(WK, '22:00')), v: 58 }] });
  });

  it('pref moveGoal: an integer kcal in 100–2,000 per person, in at order; anything else is ignored', () => {
    const goal = (when: string, person: PersonId, value: unknown) => ev(when, person, 'pref', { key: 'moveGoal', value });
    const s = reduce(rows([
      goal(at(WK, '09:00'), 'A', 700),
      goal(at(WK, '10:00'), 'A', 99), goal(at(WK, '10:00'), 'A', 2001), goal(at(WK, '10:00'), 'A', 550.5),
      goal(at(WK, '10:00'), 'A', '500'), goal(at(WK, '10:00'), 'A', null),
      goal(at(WK, '12:30'), 'A', 100), goal(at(WK, '12:00'), 'B', 2000)
    ]));
    expect(s.moveGoals.A.map((x) => x.v)).toEqual([700, 100]);
    expect(s.moveGoals.B.map((x) => x.v)).toEqual([2000]);
    expect(s.prefs).toEqual({ A: {}, B: {} });
  });

  it('spend and spend_void: a reward at its price, string ids, first id wins, either of us voids, once', () => {
    const buy = (spendId: unknown, extra: object = {}) => ({ spendId, item: 'snack', bells: 8, ...extra });
    const s = reduce(rows([
      ev(at(WK), 'B', 'spend', buy(7)), // not a string id
      ev(at(WK), 'B', 'spend', buy('7')),
      ev(at(WK), 'B', 'spend', buy('7', { item: 'dinner', bells: 15 })), // the id again
      ev(at(WK), 'B', 'spend', buy('x', { bells: 15 })), // not its price
      ev(at(WK), 'B', 'spend', buy('y', { item: 'cake' })), // not a reward
      ev(at(WK), 'B', 'spend', { spendId: 'nopot', bells: 8 }), // no item
      ev(at(WK, '12:30'), 'A', 'spend_void', { spendId: '7' }), // the partner's: it counts
      ev(at(WK, '13:00'), 'B', 'spend_void', { spendId: 'nopot' }), // not an accepted spend
      ev(at(WK, '13:00'), 'B', 'spend_void', { spendId: '7' }), // twice
      ev(at(WK, '14:00'), 'A', 'spend_void', { spendId: '7' }) // three times
    ]));
    expect(s.bellSpends).toEqual([{ at: Date.parse(at(WK)), person: 'B', spendId: '7', item: 'snack', bells: 8 }]);
    expect(s.spendVoids.map((v) => [v.person, v.at])).toEqual([['A', Date.parse(at(WK, '12:30'))]]);
  });

  it('a row of a type the server refuses (a hand edit of the sheet) is ignored, not a crash', () => {
    const odd = [ev(at('2026-12-02'), 'A', 'nonsense', { x: 1 }), ev(at('2026-12-02'), 'B', 'spend', { spendId: 'y', item: 'snack', amount: 8 })];
    const tick = ev(at('2026-12-03'), 'B', 'highfive', {});
    const a = reduce(rows([...odd, tick]));
    const b = reduce(rows([tick]));
    expect(a.highfives).toHaveLength(1);
    expect({ ...a, ats: [] }).toEqual({ ...b, ats: [] }); // only the row counts differ
  });

  it('an event type the model doesn’t know (old `gym_set`, `metric_set`, `workout_add`, `workout_edit` rows in the sheet) is ignored', () => {
    const s = reduce(rows([
      ev(at(WK, '21:00'), 'A', 'gym_set', { date: WK, on: true }),
      ev(at(WK, '21:00'), 'B', 'metric_set', { date: WK, metric: 'steps', value: 5000 }),
      ev(at(WK, '21:00'), 'B', 'metric_set', { date: WK, metric: 'weight', value: 55 }),
      ev(at(WK, '21:00'), 'A', 'workout_add', { id: 'm:1', date: WK, type: 'Yoga', durationMin: 30 }),
      ev(at(WK, '21:30'), 'A', 'workout_edit', { id: 'm:1', excluded: true })
    ]));
    expect({ ...s, ats: [] }).toEqual({ ...reduce(rows([])), ats: [] });
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

  it('every roster id can be picked, hyphenated ones too (kk-slider, tom-nook, agent-s)', () => {
    for (const id of ROSTER_IDS) {
      const s = reduce(rows([ev(at(WK), 'A', 'pref', { key: 'villager', value: id })]));
      expect(s.prefs.A?.villager).toBe(id);
    }
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
