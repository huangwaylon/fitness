import { describe, expect, it } from 'vitest';
import { due } from './frameRate.svelte.ts';

/** The display frames drawn of `n` vsyncs at `hz` (jittered by up to `jit` ms) under a cap of `fps`. */
function drawn(hz: number, fps: number, n = 120, jit = 0): number[] {
  const out: number[] = [];
  let last = 0;
  for (let i = 1; i <= n; i++) {
    const t = (i * 1000) / hz + (i % 2 ? jit : -jit);
    if (due(t, last, fps)) (out.push(i), (last = t));
  }
  return out;
}
const steps = (xs: number[]) => new Set(xs.slice(1).map((x, i) => x - xs[i]));

describe('due: the frame rate’s pacing', () => {
  it('at 30 on a 60 Hz screen: every other vsync, an even cadence (never 2-3), jitter or not', () => {
    expect(steps(drawn(60, 30))).toEqual(new Set([2]));
    expect(steps(drawn(60, 30, 120, 3))).toEqual(new Set([2]));
  });
  it('at 60: every vsync of a 60 Hz screen, every other of a 120 Hz one', () => {
    expect(steps(drawn(60, 60))).toEqual(new Set([1]));
    expect(steps(drawn(120, 60))).toEqual(new Set([2]));
    expect(steps(drawn(120, 30))).toEqual(new Set([4]));
  });
  it('the first frame after rest is drawn at once', () => {
    expect(due(5000, 0, 30)).toBe(true);
    expect(due(5000, 1000, 30)).toBe(true);
  });
});
