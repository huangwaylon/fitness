// A tap on a fish's shadow, or on the water near it, casts to it (docs/design.md "Fishing"), in every kind of water,
// at the default zoom, zoomed right in and at the island's far end, on the layout's island and with a pond put down
// (the user: "often i see fish in the water, tapping the water, no reel is cast"). The causes this guards: the tap's
// water by the tap's ground alone (the river by its mouth, the sea at the mouth, the falls' pool and the river below,
// the drawn coast past the water's tiles: another water, so no fish there), and a pond's fish swimming off the island
// when the layout has no painted pond (POND far off it, a third of the pond's patches). Critters' __fish hook names
// why a tap didn't cast.
import { expect, test, type Page } from '@playwright/test';
import { is3d } from './island';
import { defaultLayout, withChanges } from '../src/lib/layout/model.ts';
import { GRID, chunkId, chunkOf, chunkString, chunkXZ } from '../src/lib/layout/grid.ts';
import { validate } from '../src/lib/layout/validate.ts';

test.use({ viewport: { width: 393, height: 852 } });

type Fish = { water: string; id: string; x: number; z: number; len: number; theirs: boolean };
type Hooks = {
  __fish: { why(): string; fish(): Fish[]; casting(): boolean };
  __world3d: { go(z: number, k?: number, x?: number): void; client(x: number, z: number): [number, number]; ground(cx: number, cy: number): { x: number; z: number } | null; limits(): { min: number; max: number }; zoomRange(): { min: number; max: number }; camStill(): boolean };
  __world: { ground(x: number, z: number): { surface: string } };
};
const hooks = <R,>(page: Page, fn: (h: Hooks) => R) => page.evaluate(`(${fn.toString()})(window)`) as Promise<R>;

/** The fish of `water` on screen (client px of its middle), the camera put where it's in view at zoom `k` (the whole
 *  island's zoom: else the least that shows it, the river's mouth at its west edge), or at the island's far end. */
async function frame(page: Page, water: string, k: number, far: boolean): Promise<{ f: Fish; at: [number, number] }> {
  const f0 = (await hooks(page, (h) => h.__fish.fish()).then((l) => l.find((f) => f.water === water)))!;
  expect(f0, `a ${water} fish`).toBeTruthy();
  const vp = page.viewportSize()!;
  const inView = ([x, y]: [number, number]) => x > 24 && x < vp.width - 24 && y > 160 && y < vp.height - 60;
  const zs = far ? [await hooks(page, (h) => h.__world3d.limits().max)] : Array.from({ length: 25 }, (_, i) => f0.z - 600 + i * 40);
  let best: { z: number; k: number; d: number } | null = null;
  for (const kk of far || k > 1 ? [k] : [k, 1.5, 2]) {
    for (const z of zs) {
      const at = await page.evaluate(([z, k, x, fz]) => {
        const w = (window as unknown as Hooks).__world3d;
        w.go(z, k, x);
        return w.client(x, fz);
      }, [z, kk, f0.x, f0.z] as const);
      const d = Math.abs(at[1] - vp.height * 0.5);
      if (inView(at) && (!best || d < best.d)) best = { z, k: kk, d };
    }
    if (best) break;
  }
  expect(best, `the ${water} fish in view`).not.toBeNull();
  await page.evaluate(([z, k, x]) => (window as unknown as Hooks).__world3d.go(z, k, x), [best!.z, best!.k, f0.x] as const);
  await expect.poll(() => hooks(page, (h) => h.__world3d.camStill())).toBe(true);
  const f = (await hooks(page, (h) => h.__fish.fish()).then((l) => l.find((x) => x.water === water)))!;
  return { f, at: await page.evaluate(([x, z]) => (window as unknown as Hooks).__world3d.client(x, z), [f.x, f.z] as const) };
}

/** A point on water near the shadow (client px, `px` away from its middle), on another side than the shadow's own
 *  body, else its middle. */
async function waterNear(page: Page, at: [number, number], px: number): Promise<[number, number]> {
  return page.evaluate(([x, y, px]) => {
    const h = window as unknown as Hooks;
    for (let a = 0; a < 16; a++) {
      const cx = x + Math.cos((a / 16) * Math.PI * 2) * px, cy = y + Math.sin((a / 16) * Math.PI * 2) * px;
      if (cx < 12 || cx > innerWidth - 12 || cy < 12 || cy > innerHeight - 12) continue;
      const g = h.__world3d.ground(cx, cy), s = g && h.__world.ground(g.x, g.z).surface;
      // (water a finger reaches: no tap area of the island's over it, a canopy, a door, a bush on the bank, a flower)
      const over = document.elementFromPoint(cx, cy)?.closest('button, [data-bush], [data-tree], [data-flower], [data-sit], [data-fixture], [data-campfire]');
      if ((s === 'water' || s === 'sea') && !over) return [cx, cy] as [number, number];
    }
    return [x, y] as [number, number];
  }, [at[0], at[1], px] as const);
}

// (the sea's shadows are in view at the whole island's zoom only: zoomed in, the camera's near end stops short of the
// shore; from the far end, the clifftop's falls' pool and the painted pond are in view)
const CASES = [
  ...(['sea', 'pond', 'river', 'mouth', 'clifftop'] as const).flatMap((w) => [[w, 'whole island', 'by'], [w, 'whole island', 'on']] as const),
  ...(['pond', 'river', 'mouth', 'clifftop'] as const).flatMap((w) => [[w, 'zoomed in', 'by'], [w, 'zoomed in', 'on']] as const),
  ...(['pond', 'clifftop'] as const).map((w) => [w, 'far end', 'by'] as const)
];
for (const [water, view, tap] of CASES)
  test(`a tap ${tap === 'on' ? 'on' : 'by'} a visible ${water} fish casts: ${view}`, async ({ page }) => {
    test.slow();
    await page.goto(`?demo&visitor=none&critter=${water === 'sea' ? 'fish' : water}&date=2026-11-04T12:00`);
    expect(await is3d(page)).toBe(true);
    await expect.poll(() => hooks(page, (h) => h.__fish?.fish().map((f) => f.water) ?? []), { timeout: 15_000 }).toContain(water);
    const { min, max } = await hooks(page, (h) => h.__world3d.zoomRange());
    const on = await frame(page, water, view === 'zoomed in' ? max : min, view === 'far end');
    // on its body, or on the water a little way off it (another side than its body): the cast, in place
    const [x, y] = tap === 'on' ? on.at : await waterNear(page, on.at, Math.min(70, on.f.len * 0.8 + 24));
    await page.mouse.click(x, y);
    await expect.poll(() => hooks(page, (h) => [h.__fish.casting(), h.__fish.why()])).toEqual([true, `cast to the ${water}’s`]);
    await expect(page.locator('[data-bobber]')).toBeAttached();
  });

/** The default island with its painted pond grass and a pond put down where one fits (the user's island has only ponds
 *  put down): its layout ops, as the record keeps them. */
function pondPutDown(): object[] {
  const AT = Date.UTC(2026, 10, 1);
  const l = defaultLayout(), codes = l.codes.slice(), chunks = new Set<number>();
  codes.forEach((c, i) => {
    if (c >> 2 !== 8 || l.tier(i % GRID.cols, Math.floor(i / GRID.cols)) !== 0) return;
    codes[i] = 4;
    chunks.add(chunkOf(i % GRID.cols, Math.floor(i / GRID.cols)));
  });
  const ops: object[] = [...chunks].map((i) => ({ sc: 'c', id: chunkId(...chunkXZ(i)), g: chunkString(codes, i), at: AT, who: 'A' }));
  const grass = withChanges(l, { tiles: [...codes].flatMap((c, i) => (c !== l.codes[i] ? [[i % GRID.cols, Math.floor(i / GRID.cols), c] as [number, number, number]] : [])) });
  for (let z = 8; z < 50; z++)
    for (let x = 2; x < 16; x++)
      if (!validate(withChanges(grass, { set: [{ id: 'p-e2e', k: 'pond', x, z, f: 0 }] })).some((i) => i.level === 'error' && i.ids?.includes('p-e2e')))
        return [...ops, { sc: 'o', id: 'p-e2e', k: 'pond', x, z, f: 0, at: AT + 1, who: 'A' }];
  throw new Error('no room for a pond');
}

test('a pond put down on an island without the painted pond: its fish in it, in view, and a tap on it casts', async ({ page }) => {
  test.slow();
  const ops = pondPutDown();
  await page.addInitScript((ops) => localStorage.setItem('island-demo.layout', ops), JSON.stringify(ops));
  await page.goto('?demo&visitor=none&critter=pond&date=2026-11-04T21:00');
  expect(await is3d(page)).toBe(true);
  const geo = await page.evaluate(() => (window as unknown as { __world: { geo(): { PONDS: unknown[]; POND: { x: number } } } }).__world.geo());
  expect(geo.PONDS).toHaveLength(1);
  expect(geo.POND.x).toBeLessThan(-1000);
  await expect.poll(() => hooks(page, (h) => h.__fish?.fish().map((f) => f.water) ?? []), { timeout: 15_000 }).toContain('pond');
  const on = await frame(page, 'pond', 1, false);
  // in the pond put down, never off the island
  expect(await hooks(page, (h) => { const f = h.__fish.fish()[0]; return h.__world.ground(f.x, f.z).surface; })).toBe('water');
  await page.mouse.click(on.at[0], on.at[1]);
  await expect.poll(() => hooks(page, (h) => h.__fish.casting())).toBe(true);
});
