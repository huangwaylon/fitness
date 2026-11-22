// A piece's use loops on the relay's clock (loopClock.ts, villager3d.ts poseTime): two phones whose device clocks differ
// show the same rep, yoga pose and climb height, and a page clock paused in an iOS sleep doesn't hold the loop back.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { base, type Body } from './poses.ts';
import { loopNow, useLoopClock } from './loopClock.ts';
import { poseTime } from './villager3d.ts';

const BODY: Body = { thigh: 1.6, shin: 1.4, hip: 3.4 };

afterEach(() => {
  useLoopClock(null);
  vi.useRealTimers();
});

/** A phone: its device clock `skew` ms off the relay's, its offset from pings measured (serverNow = Date.now() + off). */
const phone = (skew: number, now: number) => {
  vi.setSystemTime(now + skew);
  useLoopClock(() => Date.now() - skew);
};

describe('the uses’ loops on the shared clock', () => {
  it('two phones, clocks 2.65 s apart (half a yoga hold): the same time, the same pose', () => {
    vi.useFakeTimers();
    const T = 1_793_500_000_000, o = { phase: 0, speed: 0, body: BODY, seed: 0 };
    phone(0, T);
    const a = poseTime('yoga', 123), pa = JSON.stringify(base('yoga', a, o));
    phone(2650, T);
    // (its page clock elsewhere: a performance.now() paused through a sleep)
    const b = poseTime('yoga', 98_765), pb = JSON.stringify(base('yoga', b, o));
    expect(b).toBe(a);
    expect(pb).toBe(pa);
    // on the device's clock alone they'd be half a hold apart: another moment of the yoga
    useLoopClock(null);
    expect(JSON.stringify(base('yoga', loopNow(), o))).not.toBe(pa);
  });

  it('read each frame: the device clock running on through a sleep moves the loop with it; anything else keeps the frame’s t', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    const before = poseTime('run', 50);
    vi.setSystemTime(1_000_000 + 60_000);
    expect(poseTime('run', 50) - before).toBe(60_000);
    expect(poseTime('idle', 50)).toBe(50);
    expect(poseTime('walk', 50)).toBe(50);
  });
});
