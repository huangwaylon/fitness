// The island's dated days (time/holidays.ts): NH's events and ours, shared by the island and its music.
import { describe, expect, it } from 'vitest';
import { HOLIDAYS, festivale, fromEaster, holidayOn, turkeyDay } from './holidays.ts';
import { easter } from './dates.ts';

describe('holidays (time/holidays.ts)', () => {
  it('Festivale: the Monday before Ash Wednesday (Nookipedia: 2026-02-16, 2027-02-08)', () => {
    expect([2026, 2027, 2028, 2029, 2030].map(festivale)).toEqual(['2026-02-16', '2027-02-08', '2028-02-28', '2029-02-12', '2030-03-04']);
    for (const y of [2026, 2027, 2028, 2029, 2030]) {
      expect(new Date(`${festivale(y)}T12:00:00Z`).getUTCDay()).toBe(1);
      expect(fromEaster(festivale(y))).toBe(-48);
    }
  });
  it('one holiday per date at most, each on its day', () => {
    expect(holidayOn('2026-10-31')).toBe('halloween');
    expect(holidayOn(turkeyDay(2026))).toBe('turkey-day');
    expect(holidayOn('2026-12-24')).toBe('toy-day');
    expect(holidayOn(easter(2027))).toBe('bunny-day');
    expect(holidayOn('2027-02-08')).toBe('festivale');
    expect(holidayOn('2026-12-31')).toBe('countdown');
    expect(holidayOn('2026-12-25')).toBeNull();
    for (let y = 2026; y < 2060; y++) {
      for (const d of [festivale(y), easter(y), turkeyDay(y), `${y}-10-31`, `${y}-12-24`, `${y}-12-31`])
        expect(Object.values(HOLIDAYS).filter((h) => h.on(d)), d).toHaveLength(1);
    }
  });
});
