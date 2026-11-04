// A building answers a tap on its own body only (docs/design.md "Tap targets"; the user: "When I'm fishing at the
// waterfall near the back, tapping the river sometimes opens the shop"). On the user's island (the record of
// 2026-11-03, the museum at x9 z18 and the shop at x7 z49 as they placed them: the shop a tile from the river below
// the falls) a building's tap area was an upright card at its door line, 110u tall and its footprint's width, offset by
// the tent's art and squashed by the camera's foreshortening: off its body to the side, over the river beside it, and
// short of its roof. Now it's its model's silhouette. Every point of the screen where the ground under it is water
// that no building stands in front of (beside its footprint, or before it) must not be a building's, at the whole
// island's zoom and zoomed in, all down the island; and a far building's, past the horizon, nowhere.
import { expect, test, type Page } from '@playwright/test';
import RECORD from '../src/lib/layout/record-2026-11-03.json' with { type: 'json' };
import { is3d, settled } from './island';
import { layoutOpOf, mergeLayout, type LayoutEntry } from '../src/lib/contract/layout.ts';
import { footOf, layoutOf, originOf } from '../src/lib/layout/model.ts';
import { tileX, tileZ } from '../src/lib/layout/grid.ts';

test.use({ viewport: { width: 393, height: 852 } });

const USER_LAYOUT = [
  ...(RECORD as object[]),
  { who: 'A', sc: 'o', id: 'museum', at: 1.79e12, k: 'museum', x: 9, z: 18, f: 0 },
  { who: 'A', sc: 'o', id: 'shop', at: 1.79e12, k: 'shop', x: 7, z: 49, f: 0 }
];

type Box = { x0: number; x1: number; y0: number; y1: number };
/** Each building's footprint on an island of these layout ops (world x, z), by its tap area's id. */
function feetOf(ops: object[]): Record<string, Box> {
  const m = new Map<string, LayoutEntry>();
  for (const { who, ...r } of ops as Record<string, unknown>[]) {
    const op = layoutOpOf(r);
    if (op) mergeLayout(m, { ...op, who } as LayoutEntry);
  }
  const l = layoutOf(m), out: Record<string, Box> = {};
  for (const [id, as] of [['home-A', 'campsite'], ['home-B', 'home-B'], ['home-G', 'home-G'], ['museum', 'museum'], ['shop', 'shop']] as const) {
    const o = l.objects.get(id);
    if (!o) continue;
    const [w, d] = footOf(l, o), [c, r] = originOf(l, o);
    out[as] = { x0: tileX(c), x1: tileX(c + w), y0: tileZ(r), y1: tileZ(r + d) };
  }
  return out;
}
const FEET = feetOf(USER_LAYOUT);
type Hooks = {
  __world3d: { go(z: number, k?: number): void; limits(): { min: number; max: number }; ground(cx: number, cy: number): { x: number; z: number } | null };
  __world: { ground(x: number, z: number): { surface: string } };
};

/** The screen's water points (every 6 px) that a building's tap area takes though it can't stand in front of them (the
 *  water before it, or beside it at its own depth): (x, y) → the building and the ground under it. */
const strayWater = (page: Page, feet: Record<string, Box>) =>
  page.evaluate((feet) => {
    const h = window as unknown as Hooks;
    // (its eaves and roof reach a little past its footprint: 20u either side)
    const MARGIN = 20;
    const out: string[] = [];
    for (let y = 0; y < innerHeight; y += 6)
      for (let x = 0; x < innerWidth; x += 6) {
        const b = document.elementFromPoint(x, y)?.closest('[data-building]')?.getAttribute('data-building');
        if (!b) continue;
        const g = h.__world3d.ground(x, y);
        if (!g || h.__world.ground(g.x, g.z).surface !== 'water') continue;
        const f = feet[b];
        // (water well behind it may be under its roof: further off, the more the ground's spread across the screen)
        const before = g.z < f.y0 - 5, beside = g.z < f.y1 + 60 && (g.x < f.x0 - MARGIN || g.x > f.x1 + MARGIN);
        if (before || beside) out.push(`${x},${y}: ${b} over (${g.x.toFixed(0)}, ${g.z.toFixed(0)})`);
      }
    return out;
  }, feet);

// (the default island too: there the museum stands at the far end, past the horizon from the front, and its outline
// projected from behind it must not land on the river by the bridge)
for (const [name, ops] of [['the user’s island', USER_LAYOUT], ['the default island', []]] as const)
  test(`on ${name} a building’s tap area is its own body: never the river beside it, the water before it, or past the horizon`, async ({ page }) => {
    test.slow();
    const feet = feetOf([...ops]);
    if (ops.length) await page.addInitScript((ops) => localStorage.setItem('island-demo.layout', ops), JSON.stringify(ops));
    await page.goto('?demo&visitor=none&critter=none&date=2026-11-04T12:00');
    expect(await is3d(page)).toBe(true);
    if (ops.length) expect(feet.shop).toEqual({ x0: 120, x1: 330, y0: 1380, y1: 1500 });
    const { min, max } = await page.evaluate(() => (window as unknown as Hooks).__world3d.limits());
    const views: [number, number][] = [];
    for (let z = min; z < max; z += 220) views.push([z, 1], [z, 2]);
    views.push([max, 1], [max, 1.5], [max, 3.2], [1200, 1], [1300, 2]);
    for (const [z, k] of views) {
      await page.evaluate(([z, k]) => (window as unknown as Hooks).__world3d.go(z, k), [z, k] as const);
      await settled(page);
      expect(await strayWater(page, feet), `camera at z ${z}, zoom ${k}`).toEqual([]);
    }
  });

test('on the user’s island the shop’s tap area covers its roof and walls, as drawn, and opens it', async ({ page }) => {
  test.slow();
  await page.addInitScript((ops) => localStorage.setItem('island-demo.layout', ops), JSON.stringify(USER_LAYOUT));
  await page.goto('?demo&visitor=none&critter=none&date=2026-11-04T12:00');
  expect(await is3d(page)).toBe(true);
  const max = await page.evaluate(() => (window as unknown as Hooks).__world3d.limits().max);
  await page.evaluate((z) => (window as unknown as Hooks).__world3d.go(z, 1), max);
  await settled(page);
  // its roof's middle: high over its door line, where the old card never reached
  const roof = await page.evaluate((f) => {
    const w = (window as unknown as { __world3d: { client(x: number, z: number, lift?: number): [number, number] } }).__world3d;
    return w.client((f.x0 + f.x1) / 2, f.y0 + (f.y1 - f.y0) * 0.6, 100);
  }, FEET.shop);
  await expect.poll(() => page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest('[data-building]')?.getAttribute('data-building') ?? null, roof)).toBe('shop');
  await page.mouse.click(roof[0], roof[1]);
  await expect(page).toHaveURL(/\/shop/, { timeout: 15_000 });
});
