import { describe, expect, test } from 'vitest';
import { defaultLayout, extentOf } from '#lib/layout/model.ts';
import { MID_X, panBounds, panBy } from './previewCam.ts';

describe("the preview's pan", () => {
  test('keeps the pivot over the land (a tile round it), the middle inside', () => {
    const e = extentOf(defaultLayout()), b = panBounds(e);
    expect([b.x0, b.x1, b.z0, b.z1]).toEqual([e.land.x0 - 30, e.land.x1 + 30, e.land.z0 - 30, e.land.z1 + 30]);
    expect(MID_X).toBeGreaterThan(b.x0);
    expect(MID_X).toBeLessThan(b.x1);
    // (no land: nowhere to go but the middle)
    expect(panBounds({ land: { x0: 0, x1: 0, z0: 0, z1: 0 } })).toMatchObject({ x0: MID_X, x1: MID_X });
  });

  test("a drag moves the ground with the finger: the view's width of island a screen's drag, less zoomed in, more along it", () => {
    const pitch = (58 * Math.PI) / 180;
    expect(panBy(393, 0, 393, 1, pitch)[0]).toBeCloseTo(420);
    expect(panBy(393, 0, 393, 2, pitch)[0]).toBeCloseTo(210);
    const [, dz] = panBy(0, 100, 393, 1, pitch);
    expect(dz).toBeGreaterThan(panBy(100, 0, 393, 1, pitch)[0]);
  });
});
