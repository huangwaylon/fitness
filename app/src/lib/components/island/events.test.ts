import { describe, expect, it } from 'vitest';
import { eventAt } from './events.ts';

describe('NH events (events.ts)', () => {
  it('Halloween: all of Oct 31, its evening from 17:00 to midnight (Tokyo)', () => {
    expect(eventAt('2026-10-31', 0)).toEqual({ id: 'halloween', night: false });
    expect(eventAt('2026-10-31', 16)).toEqual({ id: 'halloween', night: false }); // 16:59
    expect(eventAt('2026-10-31', 17)).toEqual({ id: 'halloween', night: true }); // 17:00
    expect(eventAt('2026-10-31', 23)).toEqual({ id: 'halloween', night: true }); // 23:59
    expect(eventAt('2026-11-01', 0)).toBeNull(); // 00:00 Nov 1
    expect(eventAt('2026-10-30', 23)).toBeNull();
    expect(eventAt('2027-10-31', 20)).toEqual({ id: 'halloween', night: true }); // every year
  });
  it('a forced event (?event=) is on with its evening, any day; an unknown one is ignored', () => {
    expect(eventAt('2026-11-04', 9, 'halloween')).toEqual({ id: 'halloween', night: true });
    expect(eventAt('2026-11-04', 9, 'toy-day')).toBeNull();
    expect(eventAt('2026-10-31', 9, 'nope')).toEqual({ id: 'halloween', night: false });
  });
});
