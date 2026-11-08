import { describe, expect, it, vi } from 'vitest';
import { dayKey, jst, minuteTimer } from './clock.ts';
import { eventsAt } from '#lib/components/island/scene.ts';

// Whatever the device's zone (CI runs in UTC), the scene reads Tokyo wall-clock time, like the model.
describe('scene clock in Tokyo time', () => {
  const sunNight = new Date('2026-08-02T10:30:00Z'); // Sun Aug 2, 19:30 JST

  it('jst() reads the Tokyo fields', () => {
    expect(jst(sunNight)).toEqual({ year: 2026, month: 8, day: 2, hour: 19, minute: 30, weekday: 0 });
    expect(jst(new Date('2026-12-31T15:00:00Z'))).toMatchObject({ year: 2027, month: 1, day: 1, hour: 0, weekday: 5 });
  });

  it('dayKey and the seasonal events follow it', () => {
    expect(dayKey(new Date('2026-10-29T15:05:00Z'))).toBe('2026-10-30');
    expect(eventsAt(new Date('2026-11-16T03:00:00Z')).maple).toBe(true); // Nov 16, 12:00 JST
    expect(eventsAt(new Date('2026-11-15T14:30:00Z')).maple).toBe(false); // Nov 15, 23:30 JST
    expect(eventsAt(new Date('2026-12-23T15:30:00Z')).toyDay).toBe(true); // Dec 24, 00:30 JST
  });

  it('cherry-blossom week is Apr 1–10 and maple week Nov 16–25, Tokyo days (the pond’s petals and leaves)', () => {
    const on = (d: string) => eventsAt(new Date(`${d}+09:00`));
    const cherry = ['2027-03-31T23:30', '2027-04-01T00:30', '2027-04-05T10:00', '2027-04-10T23:30', '2027-04-11T00:30'].map((d) => on(d).cherry);
    expect(cherry).toEqual([false, true, true, true, false]);
    const maple = ['2026-11-15T23:30', '2026-11-16T00:30', '2026-11-20T10:00', '2026-11-25T23:30', '2026-11-26T00:30'].map((d) => on(d).maple);
    expect(maple).toEqual([false, true, true, true, false]);
    // an ordinary day: neither
    expect(on('2026-11-01T10:00')).toEqual({ cherry: false, maple: false, toyDay: false });
    expect(on('2027-04-05T10:00').maple || on('2026-11-20T10:00').cherry).toBe(false);
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
