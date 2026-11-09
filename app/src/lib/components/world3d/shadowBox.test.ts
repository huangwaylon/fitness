import { describe, expect, it } from 'vitest';
import { OrthographicCamera, Vector3 } from 'three';
import { shadowBox, STEP, type ShadowBox } from './shadowBox.ts';

/** engine.ts TOD's suns (day, dusk, night), its VIEW_W and ZOOM.min. */
const SUNS = [[-0.55, 1, 0.75], [0.9, 0.45, 0.4], [-0.3, 1, 0.5]] as const;
const VIEW_W = 420;

/** The 40 u step's box (before 2026-11-09), for its worst cover. */
function stepped(camZ: number, zoom: number): ShadowBox {
  const zq = Math.round(camZ / STEP) * STEP, kq = Math.round(zoom * 8) / 8;
  const half = Math.max(200, (VIEW_W / Math.max(1, kq - 0.0625)) * 0.75 + STEP);
  return { key: '', x: 0, z: zq, left: -half, right: half, top: half * 1.4, bottom: -half * 1.1, target: [0, 0, -zq - 120] };
}
/** How far the box reaches past the pivot's point ahead (its own space: left, right, bottom, top). */
function cover(b: ShadowBox, camZ: number, sunAt: readonly number[]): number[] {
  const c = new OrthographicCamera(), [tx, ty, tz] = b.target;
  c.position.set(tx + sunAt[0] * 700, ty + sunAt[1] * 700, tz + sunAt[2] * 700);
  c.lookAt(tx, ty, tz);
  c.updateMatrixWorld();
  const a = new Vector3(0, 0, -camZ - 120).applyMatrix4(c.matrixWorldInverse);
  return [a.x - b.left, b.right - a.x, a.y - b.bottom, b.top - a.y];
}
/** A scroll forward then back over 600 u in 0.5 u steps. */
const path = [...Array(1201).keys()].map((i) => 200 + i / 2).flatMap((z, _, all) => (z === 800 ? [z, ...all.slice(0, -1).reverse()] : [z]));

describe('shadowBox', () => {
  it('stays while the pivot is in its lead, then is built that far ahead the way it goes', () => {
    const sun = SUNS[0];
    const a = shadowBox(null, 300, 0, 1, sun, VIEW_W, 1)!;
    expect(a.z).toBe(300);
    expect(shadowBox(a, 360, 0, 1, sun, VIEW_W, 1)).toBeNull();
    const b = shadowBox(a, 364, 0, 1, sun, VIEW_W, 1)!;
    expect(b.z).toBeCloseTo(364 + 63);
    // back the other way: kept till past its lead behind
    expect(shadowBox(b, 365, 0, 1, sun, VIEW_W, 1)).toBeNull();
    expect(shadowBox(b, 363, 0, 1, sun, VIEW_W, 1)!.z).toBeCloseTo(300);
    // a zoom's bucket, a step across, the sun: built anew round the pivot
    expect(shadowBox(b, 400, 0, 1.2, sun, VIEW_W, 1)!.z).toBe(400);
    expect(shadowBox(b, 400, 30, 1, sun, VIEW_W, 1)!.z).toBe(400);
    expect(shadowBox(b, 400, 0, 1, SUNS[1], VIEW_W, 1)!.z).toBe(400);
  });

  it('redraws a scroll a third as often as the 40 u step did', () => {
    let box: ShadowBox | null = null, built = 0, steps = 0, last = '';
    for (let z = 100; z <= 1100; z++) {
      const b = shadowBox(box, z, 0, 1, SUNS[0], VIEW_W, 1);
      if (b) (box = b), built++;
      const k = String(Math.round(z / STEP));
      if (k !== last) (last = k), steps++;
    }
    expect(steps).toBe(26);
    expect(built).toBeLessThanOrEqual(9);
  });

  it('covers the view as far as the 40 u step did at its worst, at every point of a scroll, every sun and zoom', () => {
    for (const sun of SUNS)
      for (const zoom of [1, 1.4, 2, 2.6, 3.2]) {
        const worst = [Infinity, Infinity, Infinity, Infinity];
        for (const z of path) cover(stepped(z, zoom), z, sun).forEach((c, i) => (worst[i] = Math.min(worst[i], c)));
        let box: ShadowBox | null = null;
        for (const z of path) {
          box = shadowBox(box, z, 0, zoom, sun, VIEW_W, 1) ?? box!;
          // (the old box sampled every 0.5 u: its worst a little short of a whole half step)
          cover(box, z, sun).forEach((c, i) => expect(c, `sun ${sun} zoom ${zoom} z ${z} side ${i}`).toBeGreaterThanOrEqual(worst[i] - 0.5));
        }
      }
  });
});
