// A room's entry timed (roomTiming.ts, perf.room): from its mount, the first frame, the models in,
// the longest display frame till a second after the first, the visit's number; nothing for a visit hidden or left first.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const logged: unknown[][] = [];
vi.mock('#lib/sync/log.ts', () => ({ log: (...a: unknown[]) => void logged.push(a) }));
const { roomTiming } = await import('./roomTiming.ts');

let now = 0, hidden = false;
const frames: FrameRequestCallback[] = [], vis: (() => void)[] = [];
/** The display's frames every `gap` ms from now till `until`. */
const run = (until: number, gap = 16) => {
  while (now < until) {
    now += gap;
    vi.advanceTimersByTime(gap);
    const fs = frames.splice(0);
    for (const f of fs) f(now);
  }
};
beforeEach(() => {
  vi.useFakeTimers();
  logged.length = frames.length = vis.length = 0;
  now = 1000;
  hidden = false;
  vi.stubGlobal('performance', { now: () => now });
  vi.stubGlobal('requestAnimationFrame', (f: FrameRequestCallback) => frames.push(f));
  vi.stubGlobal('cancelAnimationFrame', () => void (frames.length = 0));
  vi.stubGlobal('document', { get hidden() { return hidden; }, addEventListener: (_: string, f: () => void) => vis.push(f), removeEventListener() {} });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('roomTiming (perf.room)', () => {
  it('the first frame, the models in, the longest frame after the first, the visit', async () => {
    let pending = 3, ready!: () => void;
    const t = roomTiming('tent');
    t.engine({ ready: new Promise<void>((r) => (ready = r)) }, () => pending);
    run(1300);
    ready();
    await Promise.resolve();
    run(1500);
    // (one long frame, then the last model in)
    now += 90;
    run(1800);
    pending = 0;
    run(2500);
    expect(logged).toEqual([['perf.room', { room: 'tent', first: 304, models: 826, long: 106, n: 1 }]]);
    const again = roomTiming('tent');
    again.engine({ ready: Promise.resolve() }, () => 0);
    await Promise.resolve();
    run(4000);
    expect(logged[1]).toEqual(['perf.room', expect.objectContaining({ room: 'tent', n: 2 })]);
  });

  it('none for a visit hidden or left before it was over; models -1 past 10 s', async () => {
    const left = roomTiming('shop');
    left.engine({ ready: Promise.resolve() }, () => 1);
    await Promise.resolve();
    run(1500);
    left.stop();
    const away = roomTiming('museum');
    away.engine({ ready: Promise.resolve() }, () => 0);
    hidden = true;
    for (const f of vis) f();
    run(4000);
    expect(logged).toEqual([]);
    hidden = false;
    const slow = roomTiming('home');
    slow.engine({ ready: Promise.resolve() }, () => 1);
    await Promise.resolve();
    run(16_000, 50);
    expect(logged).toEqual([['perf.room', expect.objectContaining({ room: 'home', models: -1 })]]);
  });
});
