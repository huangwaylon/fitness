import { describe, expect, it } from 'vitest';
import { dayKey, jst } from './clock.ts';
import { clockTime } from '#lib/i18n/format.ts';
import { eventsAt } from '#lib/components/island/scene.ts';

// Whatever the device's zone (CI runs in UTC), the scene reads Tokyo wall-clock time, like the model.
describe('scene clock in Tokyo time', () => {
  const sunNight = new Date('2026-08-02T10:30:00Z'); // Sun Aug 2, 19:30 JST

  it('jst() reads the Tokyo fields', () => {
    expect(jst(sunNight)).toEqual({ year: 2026, month: 8, day: 2, hour: 19, minute: 30, weekday: 0 });
    expect(jst(new Date('2026-12-31T15:00:00Z'))).toMatchObject({ year: 2027, month: 1, day: 1, hour: 0, weekday: 5 });
  });

  it('dayKey, clockTime and the seasonal events follow it', () => {
    expect(dayKey(new Date('2026-10-29T15:05:00Z'))).toBe('2026-10-30');
    expect(clockTime(new Date('2026-10-29T15:05:00Z'))).toBe('0:05');
    expect(eventsAt(sunNight).fireworks).toBe(true);
    expect(eventsAt(new Date('2026-08-02T09:30:00Z')).fireworks).toBe(false); // 18:30 JST
  });
});
