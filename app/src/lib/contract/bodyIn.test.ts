// InBody's metrics from the lean mass (contract/bodyIn.ts): its BMR, the 筋肉量 / 骨格筋量 estimates, and what a
// `body_in` reading may carry.
import { describe, expect, it } from 'vitest';
import { bodyInOf, bodyInValue, estimateKg, estimateRatio, inbodyBmr, PER_FFM } from './bodyIn.ts';
import { validEventData } from './record.ts';
import { eventSubject } from './api.ts';

describe('inbodyBmr', () => {
  it("InBody's own figures (a 2026-11-19 sheet): 54.6 kg at 17.3 kg fat → FFM 37.3 kg → 1,176 kcal; 56.9 − 17.7 = 39.2 kg → 1,217 (InBody printed 1,216 from its unrounded FFM)", () => {
    expect(inbodyBmr(37.3)).toBe(1176);
    expect(inbodyBmr(54.6 - 17.3)).toBe(1176);
    expect(Math.abs(inbodyBmr(56.9 - 17.7) - 1216)).toBeLessThanOrEqual(1);
  });
});

describe('estimateRatio / estimateKg', () => {
  // an InBody sheet's (2026-11-19, 17 days): FFM (from its BMR) → 筋肉量, 骨格筋量; the first and last two calibrate, the
  // chart's peak and trough check
  const sheet = [{ lean: 39.2, slm: 36.7, smm: 21.1 }, { lean: 37.3, slm: 35.1, smm: 20.4 }];
  const checks = [...sheet, { lean: 39.4, slm: 37.1, smm: 21.5 }, { lean: 36.7, slm: 34.6, smm: 20.1 }];
  const off = (m: 'muscle_kg' | 'smm_kg', ratio: number) => Math.max(...checks.map((c) => Math.abs(estimateKg(c.lean, ratio) - (m === 'muscle_kg' ? c.slm : c.smm))));

  it('calibrated by two readings: within 0.25 kg of every InBody value on the sheet', () => {
    const slm = estimateRatio('muscle_kg', 'f', sheet.map((c) => ({ lean: c.lean, v: c.slm })));
    const smm = estimateRatio('smm_kg', 'f', sheet.map((c) => ({ lean: c.lean, v: c.smm })));
    expect([slm.calibrated, smm.calibrated]).toEqual([true, true]);
    expect(slm.ratio).toBeCloseTo(0.9386, 3);
    expect(smm.ratio).toBeCloseTo(0.5426, 3);
    expect(off('muscle_kg', slm.ratio)).toBeLessThanOrEqual(0.25);
    expect(off('smm_kg', smm.ratio)).toBeLessThanOrEqual(0.25);
  });

  it('without readings the sex’s ratio (筋肉量 0.94 either; 骨格筋量 0.57 men, 0.54 women, 0.555 unknown): the same sheet within 0.35 kg', () => {
    expect(estimateRatio('muscle_kg', 'm', [])).toEqual({ ratio: 0.94, calibrated: false });
    expect(estimateRatio('smm_kg', 'm', [])).toEqual({ ratio: 0.57, calibrated: false });
    expect(estimateRatio('smm_kg', 'f', [])).toEqual({ ratio: 0.54, calibrated: false });
    expect(estimateRatio('smm_kg', null, []).ratio).toBe(PER_FFM.smm_kg.x);
    expect(off('muscle_kg', PER_FFM.muscle_kg.f)).toBeLessThanOrEqual(0.35);
    expect(off('smm_kg', PER_FFM.smm_kg.f)).toBeLessThanOrEqual(0.35);
  });

  it('a reading off the plausible ratios (a typo, another scale’s) is ignored; one decimal', () => {
    expect(estimateRatio('smm_kg', 'm', [{ lean: 60, v: 55 }])).toEqual({ ratio: 0.57, calibrated: false });
    expect(estimateRatio('muscle_kg', 'f', [{ lean: 40, v: 20 }, { lean: 40, v: 37.2 }])).toMatchObject({ ratio: 0.93, calibrated: true });
    expect(estimateKg(37.3, 0.54)).toBe(20.1);
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
