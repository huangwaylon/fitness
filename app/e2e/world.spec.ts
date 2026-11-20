// The island's tap areas over the 3D canvas (docs/design.md "World"): one depth order for everything (behind a tree a
// villager's is hidden by it; just in front it covers the trunk while the canopy covers its head; a building likewise),
// and taps land on the tap areas far up near the horizon.
import { expect, test, type Page } from './fixtures.ts';
import { geo, type Geo, islandUp, settled, villager, w3, type W3 } from './island.ts';

test.use({ viewport: { width: 390, height: 844 } });

type W = { go(z: number): void; cam(): number; stops(): number[]; idle(): boolean; at(x: number, z: number): [number, number]; put(x: number, z: number): void };
const call = <T,>(page: Page, fn: (w: W, a: number[]) => T, args: number[] = []) =>
  page.evaluate(([f, a]) => new Function('w', 'a', `return (${f})(w, a)`)((window as unknown as { __world: W }).__world, a), [fn.toString(), args] as const) as Promise<T>;

/** `cam`: a camera z, or one from the page's island's places (world.ts's: the layout's on it). */
async function open(page: Page, cam: number | ((g: Geo) => number)) {
  await page.goto('?demo&season=summer&date=2026-07-01T10:00');
  await islandUp(page);
  const z = typeof cam === 'number' ? cam : cam(await geo(page));
  await call(page, (w, [z]) => w.go(z), [z]);
  // my villager's 3D model in (its tap area the model's core, actor().v3: till then the 2D figure's, taller, and the
  // canopy didn't cover its head: CI's red now and then, ~1 s of fixed waits short of it), then the island at rest
  await expect.poll(async () => (await villager(page))?.v3, { message: 'my villager drawn in 3D' }).toBe(true);
  await settled(page);
}

/** Put my villager at (x, z) and say who is on top at a point of it (fy: 0 its head … 1 its feet), by the 3D pick (its
 *  tap areas' depth order: world3d/pick3d.ts): `mine`, else `kind:id`. */
async function topAt(page: Page, x: number, z: number, fy: number) {
  await call(page, (w, [x, z]) => w.put(x, z), [x, z]);
  await settled(page);
  // (its figure: its tap area, its model's own box: actor().v3; moved with it, its foot where the world puts it: the 3D
  // island's frame after the put)
  const foot = await call(page, (w, [x, z]) => w.at(x, z), [x, z]);
  await expect.poll(async () => ((b) => !!b?.foot && Math.hypot(b.foot[0] - foot[0], b.foot[1] - foot[1]) < 2)(await w3(page, (w) => w.box('villager', 'mine'))), { message: 'its tap area moved with it' }).toBe(true);
  const r = (await w3(page, (w) => w.box('villager', 'mine')))!;
  return page.evaluate(([px, py]) => {
    const p = (window as unknown as { __world3d: W3 }).__world3d.pick(px, py);
    if (p?.kind === 'villager' && p.id === 'mine') return 'mine';
    return p ? `${p.kind}:${p.id}` : null;
  }, [r.left + r.width / 2, r.top + r.height * fy]);
}

test('a villager behind a tree is hidden by it; just in front it covers the trunk and the canopy covers its head', async ({ page }) => {
  await open(page, 300);
  // the oak behind the lawn (where the page's island has it: a building may move it aside)
  const oak = (await geo(page)).SCENERY.find((s) => s.id === 'oak-m1')!;
  expect(await topAt(page, oak.x, oak.z + 16, 0.55)).toBe('tree:oak-m1');
  expect(await topAt(page, oak.x, oak.z - 8, 0.92)).toBe('mine');
  // (in front of the trunk, only the canopy, 14u nearer, can be over it)
  expect(await topAt(page, oak.x, oak.z - 8, 0.08)).toBe('tree:oak-m1');
  expect(await topAt(page, oak.x, oak.z - 50, 0.1)).toBe('mine');
});

test('behind a building it is hidden, in front of it it covers it', async ({ page }) => {
  const tent = (g: Geo) => g.BUILDINGS.find((b) => b.id === 'campsite')!;
  await open(page, (g) => tent(g).z - 224);
  // the campsite's tent (its door line at x, z)
  const b = tent(await geo(page));
  expect(await topAt(page, b.x, b.z + 16, 0.6)).toBe('building:campsite');
  expect(await topAt(page, b.x, b.z - 24, 0.4)).toBe('mine');
});

test('a tap on a sprite far up near the horizon lands on it (hit-testing follows the transforms)', async ({ page }) => {
  await open(page, (g) => g.BUILDINGS.find((b) => b.id === 'campsite')!.z - 684);
  // the campsite, far up the island: its body's tap area, small near the horizon
  const r = (await w3(page, (w) => w.box('building', 'campsite')))!;
  expect(r.height).toBeGreaterThan(10);
  const hit = await page.evaluate(([x, y]) => ((p) => p?.kind === 'building' && p.id === 'campsite')((window as unknown as { __world3d: W3 }).__world3d.pick(x, y)), [r.left + r.width / 2, r.top + r.height * 0.8]);
  expect(hit).toBe(true);
});
