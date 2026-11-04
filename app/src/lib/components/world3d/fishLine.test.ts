import { describe, expect, it } from 'vitest';
import { LINE_MAX, LINE_MIN, baseLift, blocksOf, liftOf, linePoints, pointsFor, type Block, type P3 } from './fishLine.ts';
import { defaultLayout } from '#lib/layout/model.ts';

const flat = () => 0;
/** The drawn line's points (x, y, z) and its lowest clearance over `top` away from its ends (u). */
function drawn(a: P3, b: P3, ground: (x: number, z: number) => number, blocks: Block[] = []) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = pointsFor(len), buf = new Float32Array(LINE_MAX * 3);
  linePoints(buf, n, a, b, liftOf(a, b, ground, blocks));
  const pts = Array.from({ length: n }, (_, i) => [buf[i * 3], buf[i * 3 + 1], buf[i * 3 + 2]]);
  const top = (x: number, z: number) => Math.max(ground(x, z), ...blocks.filter((q) => x >= q.x0 && x <= q.x1 && z >= q.z0 && z <= q.z1).map((q) => q.top));
  const plan = Math.hypot(b[0] - a[0], b[2] - a[2]);
  const clear = Math.min(...pts.filter(([x, , z]) => Math.hypot(x - a[0], z - a[2]) > 24 && Math.hypot(x - b[0], z - b[2]) > 24).map(([x, y, z]) => y - top(x, z)));
  return { pts, n, plan, clear };
}

describe('the fishing line (fishLine.ts)', () => {
  it('runs from the rod’s tip to the float exactly, sagging by its length, smooth, a point every 16u at most 64', () => {
    const bad: string[] = [];
    for (const len of [20, 60, 120, 200, 400, 800, 1200, 1800]) {
      // (nothing under it: its own sag)
      const a: P3 = [0, 40, 0], b: P3 = [len, 2, 0], { pts, n } = drawn(a, b, () => -1e4);
      if (pts[0].some((v, i) => Math.abs(v - a[i]) > 1e-3) || pts[n - 1].some((v, i) => Math.abs(v - b[i]) > 1e-3)) bad.push(`${len}: ends`);
      if (n < LINE_MIN || n > LINE_MAX || (n < LINE_MAX && len / (n - 1) > 16.01)) bad.push(`${len}: ${n} points`);
      const mid = pts[Math.floor((n - 1) / 2)], k = Math.floor((n - 1) / 2) / (n - 1), chord = a[1] + (b[1] - a[1]) * k;
      const l3 = Math.hypot(len, b[1] - a[1]), sag = chord - mid[1], want = Math.max(6 * Math.min(1, l3 / 100), l3 * 0.04) * 4 * k * (1 - k);
      if (Math.abs(sag - want) > 0.01) bad.push(`${len}: sag ${sag.toFixed(2)}, not ${want.toFixed(2)}`);
      // smooth: no kink between segments
      for (let i = 1; i < n - 1; i++) {
        const d1 = [pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]], d2 = [pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]];
        const turn = Math.abs(Math.atan2(d2[1], d2[0]) - Math.atan2(d1[1], d1[0]));
        if (turn > 0.2) bad.push(`${len}: kink at ${i}`);
      }
    }
    expect(bad).toEqual([]);
    // the short sag and the long one meet without a jump
    expect(Math.abs(baseLift(151) - baseLift(149))).toBeLessThan(0.1);
  });

  it('a long sag over the sea keeps over its surface', () => {
    const bad: string[] = [];
    for (const len of [300, 800, 1600]) {
      const r = drawn([0, 40, 0], [len, 0.5, 0], () => 0);
      if (!(r.clear > 3)) bad.push(`${len}: ${r.clear.toFixed(1)}u over the water`);
    }
    expect(bad).toEqual([]);
  });

  it('a long line clears a ridge and a house between my villager and the water', () => {
    // a cliff 60u high across the way and a museum-tall block on it
    const ridge = (x: number) => (x > 200 && x < 420 ? 60 : 0);
    const house: Block = { x0: 280, x1: 360, z0: -40, z1: 40, top: 60 + 117 };
    const r = drawn([0, 40, 0], [700, 2, 0], (x) => ridge(x), [house]);
    expect(r.clear).toBeGreaterThan(3);
    // the straight line would have gone through both
    expect(40 + (2 - 40) * (300 / 700)).toBeLessThan(house.top);
  });

  it('on the default island: every block is a real box with its drawn height', () => {
    const blocks = blocksOf(defaultLayout(), flat);
    expect(blocks.length).toBeGreaterThan(10);
    expect(blocks.filter((b) => !(b.x1 > b.x0 && b.z1 > b.z0 && b.top > 0))).toEqual([]);
  });
});
