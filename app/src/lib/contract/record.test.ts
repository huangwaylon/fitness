// The record's rules (contract/record.ts): `prefTaken` agrees with what the model takes, and the slots.
import { describe, expect, it } from 'vitest';
import { eventSlot, prefTaken, validEventData } from './record.ts';
import { DEFAULT_LOOKS } from './look.ts';
import { reduce } from '../model/state.ts';
import type { EventRow } from './api.ts';

describe('prefTaken', () => {
  it('is exactly what the model takes (a pref it ignores leaves the earlier one in force)', () => {
    const cases: [string, unknown][] = [
      ['locale', 'ja'], ['locale', 'fr'], ['villagerName', 'うめ'], ['villagerName', '  '], ['villagerName', 'x'.repeat(21)], ['villagerName', 7],
      ['villager', 'ankha'], ['villager', 'Ankha'], ['goalWeight', 60.5], ['goalWeight', 60.55], ['goalWeight', null], ['goalWeight', ''], ['goalWeight', 400],
      ['goalBodyFat', 22.5], ['goalBodyFat', 3], ['goalBodyFat', 60], ['goalBodyFat', 2.9], ['goalBodyFat', 60.1], ['goalBodyFat', 22.55], ['goalBodyFat', null], ['goalBodyFat', ''], ['goalBodyFat', '22'],
      ['moveGoal', 450], ['moveGoal', 450.5], ['moveGoal', 50], ['stepsGoal', 9000], ['stepsGoal', 9100], ['nope', 1],
      ['look', { kind: 'player', look: DEFAULT_LOOKS.B }], ['look', { kind: 'player', look: { hair: 'PlayerHair12' } }], ['look', { kind: 'player' }], ['look', 'goldie'], ['look', null],
      ['savedLooks', [{ id: 'abcd1234', name: 'あ', look: DEFAULT_LOOKS.A }]], ['savedLooks', 'x']
    ];
    const before: EventRow = ['2026-11-01T00:00:00.000Z', 'A', 'p0', 'pref', ''];
    const seed: Record<string, unknown> = { look: { kind: 'villager' }, savedLooks: [], locale: 'en', villagerName: 'ウェイ', villager: 'bob', goalWeight: 70, goalBodyFat: 25, moveGoal: 300, stepsGoal: 7000 };
    for (const [key, value] of cases) {
      const base = reduce({ metrics: [], events: [[...before.slice(0, 4), JSON.stringify({ key, value: seed[key] ?? 1 })] as EventRow] });
      const after = reduce({ metrics: [], events: [[...before.slice(0, 4), JSON.stringify({ key, value: seed[key] ?? 1 })] as EventRow, ['2026-11-01T00:00:01.000Z', 'A', 'p1', 'pref', JSON.stringify({ key, value })]] });
      const pick = (s: ReturnType<typeof reduce>) => JSON.stringify([s.prefs.A, s.dailyGoals.A.move.map((g) => g.v), s.dailyGoals.A.steps.map((g) => g.v)]);
      const changedOrSame = pick(after) !== pick(base) || value === seed[key];
      expect(prefTaken(key, value), `${key} ${JSON.stringify(value)}`).toBe(key !== 'nope' && changedOrSame);
    }
  });
});

describe('eventSlot', () => {
  const at = Date.parse('2026-11-01T15:30:00.000Z'); // 00:30 on 11-02 in Tokyo
  it('a day row per sender and date, a cosmetic pref per subject, a goal per subject and Tokyo day, a decoration per scope and id', () => {
    expect(eventSlot('tally', 'A', 'A', { date: '2026-11-02' }, at)).toBe('tally|A|2026-11-02');
    expect(eventSlot('island', 'B', 'B', { date: '2026-11-02' }, at)).toBe('island|B|2026-11-02');
    expect(eventSlot('pref', 'A', 'A', { key: 'villager', value: 'ankha' }, at)).toBe('pref|A|villager');
    expect(eventSlot('pref', 'A', 'B', { key: 'goalWeight', value: 60, person: 'B' }, at)).toBe('pref|B|goalWeight');
    // the body fat goal: latest only per person, like the weight goal (shown, never prices a day)
    expect(eventSlot('pref', 'B', 'A', { key: 'goalBodyFat', value: 18.5, person: 'A' }, at)).toBe('pref|A|goalBodyFat');
    expect(eventSlot('pref', 'A', 'A', { key: 'goalBodyFat', value: null }, at)).toBe('pref|A|goalBodyFat');
    expect(eventSlot('pref', 'A', 'A', { key: 'goalBodyFat', value: 61 }, at)).toBeNull(); // out of bounds: ignored
    expect(eventSlot('pref', 'B', 'A', { key: 'moveGoal', value: 450, person: 'A' }, at)).toBe('pref|A|moveGoal|2026-11-02');
    expect(eventSlot('pref', 'A', 'A', { key: 'moveGoal', value: 45 }, at)).toBeNull(); // the model ignores it
    expect(eventSlot('decor', 'A', 'A', { id: 'd000001' }, at)).toBe('decor||d000001');
    expect(eventSlot('decor', 'A', 'A', { id: 'd000001', sc: 't' }, at)).toBe('decor|t|d000001');
    for (const t of ['spend', 'spend_void', 'harvest', 'find']) expect(eventSlot(t, 'A', 'A', {}, at)).toBeNull();
  });

  it('the look and the コーデ: one each per person, the latest', () => {
    expect(eventSlot('pref', 'B', 'B', { key: 'look', value: { kind: 'player', look: DEFAULT_LOOKS.A } }, at)).toBe('pref|B|look');
    expect(eventSlot('pref', 'G', 'G', { key: 'look', value: null }, at)).toBe('pref|G|look');
    expect(eventSlot('pref', 'A', 'A', { key: 'savedLooks', value: [] }, at)).toBe('pref|A|savedLooks');
    expect(eventSlot('pref', 'A', 'A', { key: 'look', value: 'x' }, at)).toBeNull();
  });
});

describe('validEventData: the look', () => {
  const now = Date.parse('2026-11-05T03:00:00.000Z');
  const ok = (key: string, value: unknown) => validEventData('pref', { key, value }, now);
  it('takes a whole look, a villager, null, and at most 20 whole コーデ; refuses the rest', () => {
    expect(ok('look', { kind: 'player', look: DEFAULT_LOOKS.A })).toBe(true);
    expect(ok('look', { kind: 'villager' })).toBe(true);
    expect(ok('look', null)).toBe(true);
    expect(ok('look', { kind: 'player', look: { ...DEFAULT_LOOKS.A, hair: 'TopsTexX' } })).toBe(false);
    expect(ok('look', { kind: 'player', look: { hair: 'PlayerHair12' } })).toBe(false);
    expect(ok('look', 'goldie')).toBe(false);
    const s = (i: number) => ({ id: `abcd${String(i).padStart(4, '0')}`, name: `コーデ ${i}`, look: DEFAULT_LOOKS.B });
    expect(ok('savedLooks', [])).toBe(true);
    expect(ok('savedLooks', Array.from({ length: 20 }, (_, i) => s(i)))).toBe(true);
    expect(ok('savedLooks', Array.from({ length: 21 }, (_, i) => s(i)))).toBe(false);
    expect(ok('savedLooks', [{ ...s(1), name: 'x'.repeat(13) }])).toBe(false);
    expect(ok('savedLooks', null)).toBe(false);
  });
});
