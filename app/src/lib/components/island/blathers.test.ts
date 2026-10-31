import { describe, expect, it } from 'vitest';
import { GREETINGS, awake, blathersLine } from './blathers.ts';
import ja from '#lib/i18n/ja.json';
import en from '#lib/i18n/en.json';

describe("Blathers' lines", () => {
  it('drowsy by day, lively by night (an owl: awake 19:00–05:00)', () => {
    expect(awake(12)).toBe(false);
    expect(awake(18)).toBe(false);
    expect(awake(19)).toBe(true);
    expect(awake(23)).toBe(true);
    expect(awake(4)).toBe(true);
    expect(awake(5)).toBe(false);
    expect(blathersLine(12, false, () => 0)).toMatch(/^museum\.day\.\d$/);
    expect(blathersLine(21, false, () => 0)).toMatch(/^museum\.night\.\d$/);
  });
  it('mostly the latest find when there is a recent one (in the mood of the hour), else a greeting', () => {
    expect(blathersLine(12, false, () => 0)).toBe('museum.day.0');
    expect(blathersLine(22, false, () => 0.99)).toBe('museum.night.2');
    expect(blathersLine(12, true, () => 0)).toBe('museum.day.find');
    expect(blathersLine(2, true, () => 0)).toBe('museum.night.find');
    expect(blathersLine(12, true, () => 0.99)).toMatch(/^museum\.day\.\d$/); // 2 in 5: a greeting all the same
  });
  it('never the same greeting twice in a row', () => {
    for (let i = 0; i < GREETINGS; i++) {
      const last = `museum.day.${i}`;
      for (const x of [0, 0.5, 0.99]) expect(blathersLine(10, false, () => x, last)).not.toBe(last);
    }
  });
  it('every line in both languages, short (a page or two of the dialogue box), the find line naming it', () => {
    for (const mood of ['day', 'night']) {
      const keys = [...Array.from({ length: GREETINGS }, (_, i) => `museum.${mood}.${i}`), `museum.${mood}.find`];
      for (const cat of [ja, en] as Record<string, string>[])
        for (const k of keys) {
          expect(cat[k], k).toBeTruthy();
          expect([...cat[k]].length, k).toBeLessThanOrEqual(cat === ja ? 40 : 80);
        }
      expect((ja as Record<string, string>)[`museum.${mood}.find`]).toContain('{name}');
      expect((en as Record<string, string>)[`museum.${mood}.find`]).toContain('{name}');
    }
    for (const k of [0, 1, 2, 'find']) expect((ja as Record<string, string>)[`museum.night.${k}`]).toContain('ホー');
  });
});
