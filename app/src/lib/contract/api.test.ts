import { describe, expect, it } from 'vitest';
import { isLocalDate } from './api.ts';

describe('isLocalDate', () => {
  it('takes exactly the real calendar dates, as Date reads them (leap years, month ends, years 0000–9999)', () => {
    const byDate = (v: string) => {
      const ms = Date.parse(`${v}T00:00:00Z`);
      return !Number.isNaN(ms) && new Date(ms).toISOString().slice(0, 10) === v;
    };
    for (const y of [0, 4, 100, 400, 1900, 2000, 2024, 2026, 2100, 9999]) {
      for (let m = 0; m <= 13; m++) {
        for (let d = 0; d <= 32; d++) {
          const v = `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          expect(isLocalDate(v), v).toBe(byDate(v));
        }
      }
    }
    for (const v of ['2026-2-01', '2026-02-01T00:00', ' 2026-02-01', 20260201, null]) expect(isLocalDate(v)).toBe(false);
  });
});
