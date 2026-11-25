import { describe, expect, it } from 'vitest';
import { PerspectiveCamera, Plane, Raycaster, Vector2, Vector3 } from 'three';
import { FOV, LIFT_BLUR, VIEW_W, ZOOM, backAt, backFor, dropPivot, endZooms, endsAt, fitZoomEnds, liftProfile, pitchAt, pose, stretchZoom, zoomOutOf } from './islandCam.ts';
import { bendPoint } from './bend.ts';
import { RECORD_ROWS, tieredLayout } from './tiered.cases.ts';
import { defaultLayout, extentOf } from '#lib/layout/model.ts';
import { fieldOf } from '#lib/layout/height.ts';

// an iPhone 15's 393 × 852 screen
const W = 393, H = 852;
/** The width the camera shows across the screen at the pivot's row, on the ground `y` high (u). */
function widthAt(k: number, y: number, lift: number): number {
  const cam = new PerspectiveCamera(FOV, W / H, 20, 8000), pitch = pitchAt(k);
  dropPivot(cam, W, H);
  pose(cam, 200, 0, 500, backFor(backAt(W / H), k, lift, pitch), pitch);
  const ray = new Raycaster(), plane = new Plane(new Vector3(0, 1, 0), -y), a = new Vector3(), b = new Vector3();
  // (the pivot's row: PIVOT_DROP below the middle, at the screen's edges)
  const ndcY = -2 * 0.16;
  ray.setFromCamera(new Vector2(-1, ndcY), cam);
  ray.ray.intersectPlane(plane, a);
  ray.setFromCamera(new Vector2(1, ndcY), cam);
  ray.ray.intersectPlane(plane, b);
  return b.x - a.x;
}

describe('islandCam: the zoom out to the land', () => {
  it('goes out to the whole land and a little sea: 530 u across for the record’s 480, never closer than the default', () => {
    expect(VIEW_W / zoomOutOf(480)).toBeCloseTo(528, 0);
    expect(zoomOutOf(480)).toBeCloseTo(0.795, 3);
    // (a wider island refits; a narrow one rests at the default)
    expect(zoomOutOf(600)).toBeLessThan(zoomOutOf(480));
    expect(zoomOutOf(300)).toBe(ZOOM.def);
    expect(widthAt(zoomOutOf(480), 0, 0)).toBeCloseTo(528, 0);
    expect(widthAt(1, 0, 0)).toBeCloseTo(VIEW_W, 0);
  });
  it('rests anywhere from the widest to fully in (no spring back to the default); gives past either end', () => {
    const lo = zoomOutOf(480);
    for (const k of [lo, 0.82, 0.9, 0.99, 1, 2, ZOOM.max]) expect(stretchZoom(k, lo)).toBe(k);
    const out = stretchZoom(lo / 1.5, lo), deep = stretchZoom(lo / 4, lo);
    expect(out).toBeLessThan(lo);
    expect(deep).toBeLessThan(out);
    expect(deep).toBeGreaterThan(lo / 1.1);
    expect(stretchZoom(ZOOM.max * 2, lo)).toBeLessThan(ZOOM.max * 1.12);
    expect(pitchAt(lo)).toBe(pitchAt(1));
  });
});

describe('islandCam: the camera backs off with the terrain', () => {
  it('shows the same width at the pivot on a cliff top as below it, at every zoom', () => {
    for (const k of [zoomOutOf(480), 1, 1.8, ZOOM.max])
      for (const y of [40, 80]) expect(widthAt(k, y, y)).toBeCloseTo(widthAt(k, 0, 0), 3);
  });
  it('lifts smoothly over a cliff’s edge: the land’s blurred height, continuous, no step a scroll', () => {
    // a land 0 u high to z 600, a 40 u cliff from there (half the width), a 40 u river bed's dip counted as level
    const land = { x0: 0, x1: 480, z0: 0, z1: 1200 };
    const h = (x: number, z: number) => (z >= 600 && x < 240 ? 40 : z > 300 && z < 330 ? -9 : 0);
    const lift = liftProfile(h, land);
    expect(lift(0)).toBe(0);
    expect(lift(600 - LIFT_BLUR - 20)).toBe(0);
    expect(lift(600 + LIFT_BLUR + 20)).toBeCloseTo(20, 6);
    expect(Math.abs(lift(600) - 10)).toBeLessThan(1);
    expect(lift(315)).toBe(0);
    let worst = 0;
    for (let z = 300; z < 900; z += 1) worst = Math.max(worst, Math.abs(lift(z + 1) - lift(z)));
    // (at most ~0.3 u of lift a unit of scroll: no jump)
    expect(worst).toBeLessThan(0.3);
  });
  it('rises to the default layout’s upper tier and stays at 0 on its front', () => {
    const lay = defaultLayout(), ext = extentOf(lay), lift = liftProfile(fieldOf(lay).ground, ext.land);
    // (the grass a little over the sea's level)
    expect(lift(ext.shore + 100)).toBeLessThan(3);
    expect(lift(ext.land.z1 - LIFT_BLUR - 30)).toBeGreaterThan(20);
  });
});

describe('islandCam: the scroll’s ends at every zoom', () => {
  // the phone's camera on a layout's ground, as engine.ts aims it (backed off with the lift, bent over the log)
  const R = 1300, HUD = 60;
  function camOn(lay: ReturnType<typeof defaultLayout>) {
    const ext = extentOf(lay), ground = fieldOf(lay).ground, lift = liftProfile(ground, ext.land), mid = (ext.land.x0 + ext.land.x1) / 2;
    const cam = new PerspectiveCamera(FOV, W / H, 20, 8000), v = new Vector3();
    dropPivot(cam, W, H);
    const sy = (cz: number, k: number, x: number, z: number, h: number) => {
      const pitch = pitchAt(k);
      pose(cam, mid, 0, cz, backFor(backAt(W / H), k, lift(cz), pitch), pitch);
      const [bx, by, bz] = bendPoint(x, ground(x, z) + h, -z, -cz, R);
      return ((1 - v.set(bx, by, bz).project(cam).y) / 2) * H;
    };
    // (the last row's highest ground across, as Island3D's fitEnds finds it)
    const ez = ext.land.z1 - 15;
    let ex = mid;
    for (let x = ext.land.x0 + 15; x < ext.land.x1; x += 30) if (ground(x, ez) > ground(ex, ez)) ex = x;
    const lo = zoomOutOf(ext.land.x1 - ext.land.x0);
    const marks = { midX: mid, shore: ext.shore, canopy: [60, 216, 120], home: [ext.home[0], ext.home[1], 60], edge: [ex, ez, 120], hud: HUD, H } as const;
    const ends = fitZoomEnds(sy, marks, endZooms(lo), ext.shore - 400, Math.max(ext.land.z1, ext.home[1]) + 700);
    return { ext, sy, ends, lo, ex, ez, mid, top: ground(ex, ez) };
  }
  const zooms = (lo: number) => [lo, (lo + 1) / 2, 1, 1.25, 1.5, 1.8, 2.2, 2.7, ZOOM.max];

  for (const [name, lay] of [['the default', defaultLayout()], ['the record’s one upper tier', tieredLayout(RECORD_ROWS)], ['tiers up to the highest', tieredLayout()]] as const)
    it(`${name}: zoomed anywhere, the far end shows the last row and its trees’ tops under the HUD, the front its shore`, () => {
      const c = camOn(lay);
      for (const k of zooms(c.lo)) {
        const { min, max } = endsAt(c.ends, k);
        // the far end: the last row's ground on screen, its trees' tops (120 u) below the HUD, a little sky over them
        const ground = c.sy(max, k, c.ex, c.ez, 0), tops = c.sy(max, k, c.ex, c.ez, 120);
        expect(ground, `k ${k}`).toBeLessThan(H);
        expect(tops, `k ${k}`).toBeGreaterThan(HUD + 16);
        // (and no further: a little less and the tops go under the HUD or the row sits above 0.42 of the screen)
        expect(Math.min(c.sy(max - 30, k, c.ex, c.ez, 120) - HUD - 16 - 0.04 * H, c.sy(max - 30, k, c.ex, c.ez, 0) - 0.42 * H), `k ${k}`).toBeLessThan(0);
        // the front: the shore on screen, the sea past it, not just sea
        const shore = c.sy(min, k, c.mid, c.ext.shore, 0);
        expect(shore, `k ${k}`).toBeLessThan(H * 0.9);
        expect(shore, `k ${k}`).toBeGreaterThan(H * 0.5);
        expect(min).toBeLessThan(max);
      }
    });

  it('the ends read between the fitted zooms linearly and hold past them', () => {
    const e = [{ k: 0.8, min: 100, max: 1000 }, { k: 1, min: 80, max: 1100 }, { k: 3.2, min: 40, max: 1500 }];
    expect(endsAt(e, 0.5)).toEqual({ min: 100, max: 1000 });
    expect(endsAt(e, 0.9)).toEqual({ min: 90, max: 1050 });
    expect(endsAt(e, 2.1).max).toBeCloseTo(1300, 6);
    expect(endsAt(e, 4)).toEqual({ min: 40, max: 1500 });
    expect(endsAt([{ k: 1, min: 5, max: 9 }], 2)).toEqual({ min: 5, max: 9 });
  });
});
