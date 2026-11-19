// InBody's metrics from the lean mass (contract/bodyEst.ts): its BMR, the 筋肉量 / 骨格筋量 estimates, and what an
// `inbody` sheet (the admin's) may carry.
import { describe, expect, it } from 'vitest';
import { estimateKg, estimateRatio, inbodyBmr, inbodyOf, PER_FFM } from './bodyEst.ts';
import { validEventData } from './record.ts';
import { EVENT_TYPES, eventSubject } from './api.ts';

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

describe('inbodyOf', () => {
  it('a day and both values in range, one decimal at most; nothing else', () => {
    const ok = { date: '2026-11-19', muscle_kg: 35.1, smm_kg: 20.4 };
    expect(inbodyOf(ok)).toEqual(ok);
    expect(inbodyOf({ date: '2026-11-19', muscle_kg: 10, smm_kg: 60 })).not.toBeNull();
    for (const d of [
      { ...ok, muscle_kg: 9.9 }, { ...ok, muscle_kg: 100.1 }, { ...ok, smm_kg: 60.5 }, { ...ok, smm_kg: 20.45 }, { ...ok, date: '2026-02-30' },
      { ...ok, smm_kg: '20' }, { ...ok, person: 'B' }, { date: '2026-11-19', muscle_kg: 35.1 }, { date: '2026-11-19', m: 'smm_kg', v: 20 }
    ]) expect(inbodyOf(d), JSON.stringify(d)).toBeNull();
  });

  it('the admin’s only: the record refuses it from any phone; no `person` on it (its row’s person is whose)', () => {
    const now = Date.parse('2026-11-19T03:00:00Z');
    expect(validEventData('inbody', { date: '2026-11-19', muscle_kg: 35.1, smm_kg: 20.4 }, now)).toBe(false);
    expect(eventSubject('inbody', { person: 'B' }, 'A')).toBeNull();
    expect((EVENT_TYPES as readonly string[]).includes('body_in')).toBe(false);
  });
});
