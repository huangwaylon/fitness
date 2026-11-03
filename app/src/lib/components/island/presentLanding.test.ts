import { describe, expect, test } from 'vitest';
import { chooseLanding, footprints, openGround, type LandView } from './presentLanding.ts';
import { worldOf } from './layoutWorld.ts';
import { defaultLayout, objMid } from '#lib/layout/model.ts';
import { walkable } from '#lib/layout/nav.ts';
import { GRID, TILE, tierOf, idx, kindOf } from '#lib/layout/grid.ts';

const l = defaultLayout();
const g = worldOf(l);
const feet = footprints(l);
const open = openGround(g.nav, g.surfaceAt, feet);

describe('presentLanding.ts: open ground for a present', () => {
  test('only open sand or grass, walkable all round, one level, off every footprint', () => {
    let n = 0;
    for (let z = -60; z < 1700; z += 7)
      for (let x = -80; x < 500; x += 7) {
        if (!open(x, z)) continue;
        n++;
        for (const [dx, dz] of [[0, 0], [12, 0], [-12, 0], [0, 12], [0, -12]]) {
          expect(['grass', 'sand']).toContain(g.surfaceAt(x + dx, z + dz));
          expect(walkable(g.nav, x + dx, z + dz)).toBe(true);
        }
        expect(feet.some((b) => x > b.x0 && x < b.x1 && z > b.y0 && z < b.y1)).toBe(false);
      }
    // plenty of the island is open
    expect(n).toBeGreaterThan(2000);
  });

  test('never the sea, a river or a pond, under a tree, a home or the stairs, nor a cliff\'s edge', () => {
    expect(open(195, -70)).toBe(false);
    for (const o of l.objects.values()) {
      const [x, z] = objMid(l, o);
      expect(open(x, z), `${o.k} ${o.id}`).toBe(false);
    }
    // every tile edge between two tiers (a cliff's), and every water tile's middle
    for (let r = 0; r < GRID.rows - 1; r++)
      for (let c = 0; c < GRID.cols; c++) {
        const a = l.codes[idx(c, r)], b = l.codes[idx(c, r + 1)], x = GRID.x0 + (c + 0.5) * TILE, z = GRID.z0 + (r + 1) * TILE;
        if (tierOf(a) !== tierOf(b)) expect(open(x, z), `cliff at ${c},${r}`).toBe(false);
        const k = kindOf(a);
        if (k === 'river' || k === 'pond' || k === 'sea') expect(open(x, z - TILE / 2)).toBe(false);
      }
  });
});

/** A flat view: the land's x across 390px, z0 … z1 from the screen's foot (844) up to the horizon (y 200). */
function view(o: Partial<LandView> = {}, z0 = 0, z1 = 800): LandView {
  return {
    screen: (x, z) => (z < z0 || z > z1 ? null : [((x + 90) / 600) * 390, 844 - ((z - z0) / (z1 - z0)) * 644]),
    box: { x0: 0, x1: 390, y0: 200, y1: 844 },
    guards: [],
    xs: [-90, 510],
    zs: [z0, z1],
    ...o
  };
}
const everywhere = () => true;

describe('chooseLanding: in the front of the view, clear of the controls', () => {
  test('in the lower part of the screen, under the burst if it can be', () => {
    for (const sx of [60, 195, 330]) {
      const p = chooseLanding(view(), everywhere, [], sx)!;
      const [px, py] = view().screen(p[0], p[1])!;
      expect(py).toBeGreaterThan(200 + 644 * 0.4);
      expect(py).toBeLessThan(844 - 40);
      expect(Math.abs(px - sx)).toBeLessThan(10);
    }
  });

  test('a burst over the back of the island (off the top of the view) still lands in front', () => {
    const v = view({}, 0, 800), p = chooseLanding(v, everywhere, [], 195)!;
    expect(v.screen(p[0], p[1])![1]).toBeGreaterThan(200 + 644 * 0.4);
  });

  test('clear of every control (the HUD, the bottom controls, the catch stack): never under one', () => {
    const guards = [{ x0: 0, x1: 390, y0: 560, y1: 844 }, { x0: 0, x1: 390, y0: 0, y1: 250 }];
    const v = view({ guards }), p = chooseLanding(v, everywhere, [], 195)!;
    const [, py] = v.screen(p[0], p[1])!;
    expect(py).toBeLessThan(560 - 10);
    expect(py).toBeGreaterThan(250);
    // the controls cover all but a sliver: still never under one
    const tight = view({ guards: [{ x0: 0, x1: 390, y0: 300, y1: 844 }] }), q = chooseLanding(tight, everywhere, [], 195);
    if (q) expect(tight.screen(q[0], q[1])![1]).toBeLessThan(300);
  });

  test('only on open ground; null with none in view', () => {
    const left = (x: number) => x < 60;
    const v = view(), p = chooseLanding(v, left, [], 330)!;
    expect(p[0]).toBeLessThan(60);
    expect(chooseLanding(v, () => false, [], 195)).toBeNull();
  });

  test('clear of what lies on the ground (another present, a find), giving way only when there is nothing else', () => {
    const p = chooseLanding(view(), everywhere, [], 195)!;
    const q = chooseLanding(view(), everywhere, [p], 195)!;
    expect(Math.hypot(q[0] - p[0], q[1] - p[1])).toBeGreaterThanOrEqual(28);
  });

  test('a short screen (its front all controls): it gives way, the front first, still inside the view', () => {
    const v = view({ guards: [{ x0: 0, x1: 390, y0: 420, y1: 844 }] }), p = chooseLanding(v, everywhere, [], 195)!;
    const [px, py] = v.screen(p[0], p[1])!;
    expect(py).toBeGreaterThan(200);
    expect(py).toBeLessThan(420);
    expect(px).toBeGreaterThan(20);
    expect(px).toBeLessThan(370);
  });
});
