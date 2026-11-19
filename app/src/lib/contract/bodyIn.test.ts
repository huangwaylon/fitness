// The からだ values typed in (contract/bodyIn.ts): InBody's BMR from the lean mass, and what a `body_in` may carry.
import { describe, expect, it } from 'vitest';
import { bodyInOf, bodyInValue, inbodyBmr } from './bodyIn.ts';
import { validEventData } from './record.ts';
import { eventSubject } from './api.ts';

describe('inbodyBmr', () => {
  it("InBody's own figures (a 2026-11-19 sheet): 54.6 kg at 17.3 kg fat → FFM 37.3 kg → 1,176 kcal; 56.9 − 17.7 = 39.2 kg → 1,217 (InBody printed 1,216 from its unrounded FFM)", () => {
    expect(inbodyBmr(37.3)).toBe(1176);
    expect(inbodyBmr(54.6 - 17.3)).toBe(1176);
    expect(Math.abs(inbodyBmr(56.9 - 17.7) - 1216)).toBeLessThanOrEqual(1);
  });
});

describe('bodyInOf', () => {
  it('a day, 筋肉量 or 骨格筋量, a value in range with one decimal at most (null clears), its person A or B', () => {
    expect(bodyInOf({ date: '2026-11-19', m: 'muscle_kg', v: 35.1 })).toEqual({ date: '2026-11-19', m: 'muscle_kg', v: 35.1 });
    expect(bodyInOf({ date: '2026-11-19', m: 'smm_kg', v: null, person: 'B' })).toEqual({ date: '2026-11-19', m: 'smm_kg', v: null, person: 'B' });
    for (const d of [
      { date: '2026-11-19', m: 'muscle_kg', v: 9.9 }, { date: '2026-11-19', m: 'muscle_kg', v: 100.1 }, { date: '2026-11-19', m: 'smm_kg', v: 60.5 },
      { date: '2026-11-19', m: 'smm_kg', v: 20.45 }, { date: '2026-02-30', m: 'smm_kg', v: 20 }, { date: '2026-11-19', m: 'lean_kg', v: 40 },
      { date: '2026-11-19', m: 'smm_kg', v: '20' }, { date: '2026-11-19', m: 'smm_kg', v: 20, person: 'G' }, { date: '2026-11-19', m: 'smm_kg', v: 20, x: 1 },
      { date: '2026-11-19', m: 'smm_kg' }
    ]) expect(bodyInOf(d), JSON.stringify(d)).toBeNull();
    expect([bodyInValue('smm_kg', 5), bodyInValue('smm_kg', 60), bodyInValue('muscle_kg', 10), bodyInValue('muscle_kg', 100)]).toEqual([true, true, true, true]);
  });

  it('the record: its day not after tomorrow (Tokyo); either member’s subject by `person`', () => {
    const now = Date.parse('2026-11-19T03:00:00Z');
    expect(validEventData('body_in', { date: '2026-11-20', m: 'muscle_kg', v: 35.1 }, now)).toBe(true);
    expect(validEventData('body_in', { date: '2025-01-01', m: 'muscle_kg', v: 35.1 }, now)).toBe(true);
    expect(validEventData('body_in', { date: '2026-11-21', m: 'muscle_kg', v: 35.1 }, now)).toBe(false);
    expect([eventSubject('body_in', { person: 'B' }, 'A'), eventSubject('body_in', {}, 'A'), eventSubject('body_in', { person: 'G' }, 'A')]).toEqual(['B', 'A', null]);
  });
});
