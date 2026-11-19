// The guest's rules (contract/guest.ts, docs/backend.md#the-guest, 2026-11-06): everything on the island a member
// writes, never the economy, the members' goals or their own records; every row but the からだ ones.
import { describe, expect, it } from 'vitest';
import { EVENT_TYPES, type EventRow, type MetricRow, type SnapshotRows } from './api.ts';
import { guestMayWrite, rowsFor } from './guest.ts';

describe('guestMayWrite', () => {
  it('takes every island event type a member writes, and refuses the economy and the members’ records', () => {
    const island = ['find', 'tally', 'tally_back', 'island', 'decor', 'board', 'food', 'food_repeat', 'food_recipe', 'food_custom', 'sell', 'buy', 'buy_starts', 'sg_reward', 'farm', 'listen', 'pack', 'pack_chk', 'pack_reset', 'room_save', 'eflag'];
    // (and `wet`, `shop_adjust`, `inbody`: the record's and the admin's own, never a phone's)
    const members = ['spend', 'spend_void', 'harvest', 'trip_note', 'wtask', 'wdone', 'wconf', 'wnote', 'wet', 'eflag_done', 'shop_adjust', 'check', 'inbody'];
    // every type is one or the other (pref apart): a new type has to be placed here
    expect([...island, ...members, 'pref'].sort()).toEqual([...EVENT_TYPES].sort());
    for (const t of island) expect(guestMayWrite(t, {}), t).toBe(true);
    for (const t of members) expect(guestMayWrite(t, {}), t).toBe(false);
  });

  it('every decor scope (the record then checks the scope as for anyone: contract/layout.ts scopeMayWrite)', () => {
    for (const sc of [undefined, 'o', 'c', 'r', 'h', 't', 'u', 'v']) expect(guestMayWrite('decor', { sc }), String(sc)).toBe(true);
  });

  it('its own prefs: cosmetic, the meal log’s goals and the island’s weather; never its profile (locked), a person’s, an activity or a からだ goal', () => {
    for (const key of ['locale', 'villagerName', 'villager', 'look', 'savedLooks', 'weatherMode', 'kcalGoal', 'proteinGoal'])
      expect(guestMayWrite('pref', { key }), key).toBe(true);
    for (const key of ['sex', 'birth', 'stepsGoal', 'moveGoal', 'exerciseGoal', 'standGoal', 'goalWeight', 'goalBodyFat', 'goalBmi', 'goalLean', 'goalMuscle', 'goalSmm'])
      expect(guestMayWrite('pref', { key }), key).toBe(false);
    expect(guestMayWrite('pref', { key: 'villagerName', person: 'A' })).toBe(false);
    expect(guestMayWrite('pref', { key: 'weatherMode', person: 'G' })).toBe(false);
  });
});

describe('rowsFor the guest', () => {
  const at = '2026-11-06T03:00:00.000Z';
  const m = (person: 'A' | 'B', metric: string, value: number): MetricRow => [at, person, '2026-11-06', metric as MetricRow[3], value];
  const e = (who: 'A' | 'B' | 'G', id: string, type: string, data: object): EventRow => [at, who, id, type as EventRow[3], JSON.stringify(data)];
  const rows: SnapshotRows = {
    metrics: [m('A', 'steps', 8000), m('A', 'weight', 68.4), m('B', 'body_fat_pct', 24.1), m('B', 'bmi', 21.2), m('A', 'lean_kg', 53.8), m('B', 'exercise_min', 31), m('A', 'move_kcal', 600), m('B', 'stand_min', 540)],
    events: [
      e('A', 'e1', 'decor', { sc: 'o', id: 'oak', at: 1, k: 'oak', x: 1, z: 1, f: 0 }),
      e('B', 'e2', 'island', { date: '2026-11-06', taken: [], puts: [], shakes: [], watered: ['fl:1:2'], wishes: {} }),
      e('A', 'e3', 'board', { id: 'b1234567', at: 1, p: 1, t: 'やあ' }),
      e('B', 'e4', 'spend', { spendId: 's1', item: 'snack' }),
      e('A', 'e5', 'pref', { key: 'goalWeight', value: 65 }),
      e('B', 'e6', 'pref', { key: 'goalBodyFat', value: 23, person: 'B' }),
      e('A', 'e7', 'pref', { key: 'goalBmi', value: 22 }),
      e('A', 'e8', 'pref', { key: 'goalLean', value: 50 }),
      e('A', 'e9', 'pref', { key: 'stepsGoal', value: 9000 }),
      e('A', 'e10', 'pref', { key: 'birth', value: '1990-01-01' }),
      e('G', 'e11', 'pref', { key: 'birth', value: '1995-01-01' }),
      e('A', 'e12', 'pref', { key: 'weatherMode', value: 'game' }),
      e('B', 'e13', 'listen', { d: '2026-11-06', g: 'ab12', gm: 'tv', u: 'waitress', lv: 7, n: 1, ms: 60_000, r: [['w1', 1, 0, 0]] }),
      e('G', 'e14', 'food', { id: 'f123456', at: 1 }),
      e('B', 'e15', 'inbody', { date: '2026-11-06', muscle_kg: 35.1, smm_kg: 20.4 }),
      e('B', 'e16', 'pref', { key: 'goalSmm', value: 21 })
    ]
  };

  it('every row but the からだ ones: no weight, body fat, BMI or lean mass, no InBody sheet, no からだ goal; everyone’s profile', () => {
    const g = rowsFor('G', rows);
    expect(g.metrics.map((r) => r[3])).toEqual(['steps', 'exercise_min', 'move_kcal', 'stand_min']);
    expect(g.events.map((r) => r[2])).toEqual(['e1', 'e2', 'e3', 'e4', 'e9', 'e10', 'e11', 'e12', 'e13', 'e14']);
    // a member's English Study row as its summary, as the other member gets it
    expect(JSON.parse(g.events.find((r) => r[2] === 'e13')![4])).toEqual({ d: '2026-11-06', g: 'ab12', ms: 60_000, gm: 'tv' });
    const text = JSON.stringify(g);
    for (const k of ['weight', 'body_fat_pct', 'bmi', 'lean_kg', 'goalWeight', 'goalBodyFat', 'goalBmi', 'goalLean', 'inbody', 'muscle_kg', 'smm_kg', 'goalSmm']) expect(text, k).not.toContain(k);
  });

  it('a member gets everything (the guest’s profile too)', () => {
    const a = rowsFor('A', rows);
    expect(a.metrics).toEqual(rows.metrics);
    expect(a.events.map((r) => r[2])).toEqual(rows.events.map((r) => r[2]));
  });

  it('a profile row naming no one it may (the guest’s sent by a member, an unknown person): no one gets it', () => {
    const odd = { metrics: [], events: [e('A', 'x1', 'pref', { key: 'sex', value: 'm', person: 'G' }), e('G', 'x2', 'pref', { key: 'birth', value: '2000-01-01', person: 'Z' })] };
    for (const who of ['A', 'B', 'G'] as const) expect(rowsFor(who, odd).events).toEqual([]);
  });
});
