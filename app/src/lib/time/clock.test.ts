import { describe, expect, it, vi } from 'vitest';
import { dayKey, jst, minuteTimer } from './clock.ts';
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

describe('the minute tick', () => {
  it('updates at each new minute while visible, never while hidden, and once on return if it missed one', () => {
    vi.useFakeTimers({ now: new Date('2026-11-02T03:00:30Z') });
    try {
      const listeners = new Set<() => void>();
      const doc = {
        hidden: false,
        addEventListener: (_t: string, f: () => void) => void listeners.add(f),
        removeEventListener: (_t: string, f: () => void) => void listeners.delete(f)
      } as unknown as Document;
      const flip = (hidden: boolean) => ((doc as { hidden: boolean }).hidden = hidden, listeners.forEach((f) => f()));
      let n = 0;
      const stop = minuteTimer(() => n++, doc);
      vi.advanceTimersByTime(30_100); // the next minute (+ the 20 ms margin)
      expect(n).toBe(1);
      flip(true);
      vi.advanceTimersByTime(10 * 60_000);
      expect(n).toBe(1); // nothing while hidden
      flip(false);
      expect(n).toBe(2); // one catch-up
      flip(true);
      flip(false);
      expect(n).toBe(2); // no minute was missed this time
      stop();
      expect(listeners.size).toBe(0);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
