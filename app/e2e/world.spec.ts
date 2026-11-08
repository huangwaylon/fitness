// The island's tap areas over the 3D canvas (docs/design.md "World"): one depth order for everything (behind a tree a
// villager's is hidden by it; just in front it covers the trunk while the canopy covers its head; a building likewise),
// and taps land on the tap areas far up near the horizon.
import { expect, test, type Page } from './fixtures.ts';
import { geo, type Geo, islandUp, settled } from './island.ts';

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
  // my villager's 3D model in (its tap area the model's core, [data-v3]: till then the 2D figure's, taller, and the
  // canopy didn't cover its head: CI's red now and then, ~1 s of fixed waits short of it), then the island at rest
  await expect(page.locator('[data-actor="mine"][data-v3]'), 'my villager drawn in 3D').toBeAttached();
  await settled(page);
}

/** Put my villager at (x, z) and say who is on top at a point of it (fy: 0 its head … 1 its feet). */
async function topAt(page: Page, x: number, z: number, fy: number) {
  await call(page, (w, [x, z]) => w.put(x, z), [x, z]);
  // the scenery's art lets taps through (pointer-events: none): make it hit-testable for the probe
  await page.addStyleTag({ content: '[data-scenery-id] .art, [data-building] .door { pointer-events: auto !important; }' });
  await settled(page);
  // (its figure: its tap area, its model's own box: Island3D's [data-v3])
  const r = (await page.locator('[data-actor="mine"] .vil').first().boundingBox())!;
  return page.evaluate(([px, py]) => {
    const e = document.elementFromPoint(px, py);
    if (!e) return null;
    if (e.closest('[data-actor="mine"]')) return 'mine';
    const tree = e.closest('[data-scenery-id]');
    if (tree) return `${(tree as HTMLElement).dataset.sceneryId}:${(tree as HTMLElement).dataset.part}`;
    const b = e.closest('[data-building]');
    if (b) return `building:${(b as HTMLElement).dataset.building}`;
    return e.className.toString() || e.tagName;
  }, [r.x + r.width / 2, r.y + r.height * fy]);
}

test('a villager behind a tree is hidden by it; just in front it covers the trunk and the canopy covers its head', async ({ page }) => {
  await open(page, 300);
  // the oak behind the lawn (where the page's island has it: a building may move it aside)
  const oak = (await geo(page)).SCENERY.find((s) => s.id === 'oak-m1')!;
  expect(await topAt(page, oak.x, oak.z + 16, 0.55)).toMatch(/^oak-m1:/);
  expect(await topAt(page, oak.x, oak.z - 8, 0.92)).toBe('mine');
  expect(await topAt(page, oak.x, oak.z - 8, 0.08)).toBe('oak-m1:canopy');
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
  // the campsite, far up the island: its door is a button, small near the horizon
  const door = page.locator('[data-building="campsite"] button');
  const r = (await door.boundingBox())!;
  expect(r.height).toBeGreaterThan(10);
  const hit = await page.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest('[data-building="campsite"]'), [r.x + r.width / 2, r.y + r.height * 0.8]);
  expect(hit).toBe(true);
});
