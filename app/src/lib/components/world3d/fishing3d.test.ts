import { afterEach, describe, expect, it, vi } from 'vitest';
import { NIBBLE_MS, angle, floatWants, nibbled, onAngle } from './fishing3d.ts';

/** The page's clock, set by hand (angle and nibbled stamp performance.now). */
let now = 0;
vi.spyOn(performance, 'now').mockImplementation(() => now);
afterEach(() => (angle(null), onAngle(null)));

describe('my float\'s frames (floatWants)', () => {
  it('bobbing: the ambience\'s; a nibble\'s dip and the bite: the full rate; no float out: none', () => {
    now = 1000;
    expect(floatWants(now), 'no line').toBe(false);
    angle('cast', { x: 10, z: 20 });
    expect(floatWants(now), 'the line flying: the rod\'s swing is the villager\'s').toBe(false);
    angle('wait');
    expect(floatWants(now + 5000)).toBe('ambient');
    now = 9000;
    nibbled();
    expect(floatWants(now)).toBe(true);
    expect(floatWants(now + NIBBLE_MS - 1)).toBe(true);
    expect(floatWants(now + NIBBLE_MS), 'the dip over').toBe('ambient');
    now = 12_000;
    angle('bite');
    expect(floatWants(now + 3000), 'from the bite till the reel').toBe(true);
    angle('reel');
    expect(floatWants(now + 3001)).toBe(false);
  });

  it('a nibble asks for a frame at once (the island at its 12 fps rest)', () => {
    const kick = vi.fn();
    onAngle(kick);
    angle('wait');
    kick.mockClear();
    nibbled();
    expect(kick).toHaveBeenCalledTimes(1);
  });

  it('a 30 s wait with two nibbles, frame by frame (dt 1000/30): the full rate only for the dips (~2.5 % of it, was all of it)', () => {
    now = 0;
    angle('wait');
    const dt = 1000 / 30, nibbles = [10_000, 20_000];
    let full = 0, frames = 0;
    for (let t = 0; t < 30_000; t += dt, frames++) {
      if (nibbles.length && t >= nibbles[0]) (now = nibbles.shift()!), nibbled();
      if (floatWants(t) === true) full++;
    }
    // (each dip's 380 ms: 11 or 12 frames, as they fall)
    expect(full).toBeGreaterThanOrEqual(2 * Math.floor(NIBBLE_MS / dt));
    expect(full).toBeLessThanOrEqual(2 * Math.ceil(NIBBLE_MS / dt));
    expect(full / frames).toBeLessThan(0.03);
  });
});
