// math.ts: the helpers' edges (clamped ends, a = b, the curves' ends and middles).
import { expect, test } from 'vitest';
import { clamp, clamp01, cubicInOut, cubicOut, hermite, smooth01, smoothstep } from './math.ts';

test('clamp and clamp01 hold the ends', () => {
  expect([clamp(-1, 0, 2), clamp(1, 0, 2), clamp(3, 0, 2)]).toEqual([0, 1, 2]);
  expect([clamp01(-0.5), clamp01(0.25), clamp01(7)]).toEqual([0, 0.25, 1]);
});

test('the smoothstep family: 0 → 0, ½ → ½, 1 → 1; clamped outside but for hermite; a = b is 1', () => {
  expect([0, 0.5, 1].map(hermite)).toEqual([0, 0.5, 1]);
  expect(hermite(-1)).toBe(5);
  expect([-1, 0.5, 2].map(smooth01)).toEqual([0, 0.5, 1]);
  expect([smoothstep(1, 3, 2), smoothstep(3, 1, 3), smoothstep(3, 1, 0), smoothstep(2, 2, 0)]).toEqual([0.5, 0, 1, 1]);
});

test('the cubic curves', () => {
  expect([0, 0.5, 1].map(cubicOut)).toEqual([0, 0.875, 1]);
  expect([0, 0.25, 0.5, 1].map(cubicInOut)).toEqual([0, 0.0625, 0.5, 1]);
});
