import { describe, expect, it } from 'vitest';
import { SEASONS } from '#lib/config/rules.ts';
import { isEasyWeek, targetsFor } from '#lib/scoring/targets.ts';

const s1 = SEASONS.find((s) => s.key === 's1')!;

describe('targetsFor', () => {
  it('returns season targets for a normal week', () => {
    expect(targetsFor('A', '2026-11-02')).toEqual(s1.targets.A);
    expect(targetsFor('B', '2026-11-02')).toEqual(s1.targets.B);
  });
  it('accepts any date in the week and returns a copy', () => {
    const t = targetsFor('A', '2026-11-05');
    expect(t).toEqual(s1.targets.A);
    t.habits[0] = 'x';
    expect(s1.targets.A.habits[0]).not.toBe('x');
  });
  it('falls back to the first season before any season starts', () => {
    expect(targetsFor('B', '2026-10-26')).toEqual(s1.targets.B);
  });
  it('applies ×0.7 in easy weeks without float drift', () => {
    const b = targetsFor('B', '2026-12-21');
    expect(b.activeMinPerWeek).toBe(59.5);
    expect(b.strengthDaysPerWeek).toBe(1.4);
    expect(b.stepDaysPerWeek).toBe(3.5);
    expect(b.stepGoal).toBe(s1.targets.B.stepGoal);
    expect(b.pearTicksPerWeek).toBe(s1.targets.B.pearTicksPerWeek);
    expect(targetsFor('A', '2026-12-28').activeMinPerWeek).toBe(94.5);
  });
  it('identifies the two easy weeks around 正月 (year wrap)', () => {
    expect(isEasyWeek('2026-12-14')).toBe(false); // Dec 14–20
    expect(isEasyWeek('2026-12-21')).toBe(true); // touches Dec 25
    expect(isEasyWeek('2026-12-28')).toBe(true); // Dec 28–Jan 3
    expect(isEasyWeek('2027-01-04')).toBe(false);
    expect(isEasyWeek('2027-12-20')).toBe(true); // Dec 20–26, 2027
    expect(isEasyWeek('2027-12-13')).toBe(false); // Dec 13–19
    expect(isEasyWeek('2027-12-27')).toBe(true); // Dec 27–Jan 2
    expect(isEasyWeek('2028-01-03')).toBe(false); // Jan 3–9, 2028: always exactly two easy weeks
    expect(isEasyWeek('2028-12-18')).toBe(false); // Dec 18–24, 2028
    expect(isEasyWeek('2028-12-25')).toBe(true);
    expect(isEasyWeek('2029-01-01')).toBe(true); // Jan 1–7, 2029
  });
});
