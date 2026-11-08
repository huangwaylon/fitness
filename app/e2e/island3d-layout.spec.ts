// The 3D island on its layout (island/site.svelte.ts site.on): the ground is the
// layout's (terrain.ts buildGround), its objects placeObjects' (one model an id: the rock is drawn once), the homes and
// NH's bridges and stairs stood on it (engine.ts placeGroup), the camera's far end at ウェイ's door; a bench put down in
// the editor (the island's one もようがえ) is drawn where it went.
import { expect, test, type Page } from './fixtures.ts';
import { openEditor } from './island.ts';

test.use({ viewport: { width: 393, height: 852 } });

type W3 = {
  loaded(): boolean;
  onLayout(): boolean;
  placedGroups(): string[];
  limits(): { min: number; max: number };
  where(id: string): { x: number; y: number; z: number; hidden: boolean; model: string } | null;
  groups(): { name: string; n: number }[];
};
const w3 = <R,>(page: Page, fn: (w: W3) => R) => page.evaluate(`(${fn.toString()})(window.__world3d)`) as Promise<R>;
const Q = '?demo&date=2026-11-04T12:00&critter=none&visitor=none';

async function open(page: Page) {
  await page.goto(Q);
  await page.waitForFunction(() => (window as unknown as { __world3d?: W3 }).__world3d?.loaded(), null, { timeout: 60_000 });
}

test('on its layout: the layout\'s ground, the homes and the structures placed, the far end at ウェイ\'s door, the rock drawn once', async ({ page }) => {
  await open(page);
  expect(await w3(page, (w) => w.onLayout())).toBe(true);
  // うめ's and the guest's homes (NH's parts) and the layout's bridges and stairs
  await expect.poll(() => w3(page, (w) => w.placedGroups().filter((g) => g.startsWith('home:')).length), { timeout: 15_000 }).toBeGreaterThan(0);
  await expect.poll(() => w3(page, (w) => w.placedGroups().some((g) => g.startsWith('structure:'))), { timeout: 15_000 }).toBe(true);
  // the long island: the camera goes on past the old campsite (z 984) to the layout's (its door at z ≈ 1394)
  expect((await w3(page, (w) => w.limits())).max).toBeGreaterThan(1150);
  // one rock: placeObjects' (the DOM node's m3 model of the same id not added again)
  const rock = await w3(page, (w) => w.where('rock'));
  expect(rock).not.toBeNull();
});

test('a bench put down in the editor is drawn on the 3D island at once, at its id', async ({ page }) => {
  await open(page);
  const count = () => page.evaluate(() => (window as unknown as { __layout: { count(k: string): number } }).__layout.count('park-bench'));
  const before = await count();
  const ed = await openEditor(page.context(), 'demo&date=2026-11-04T12:00');
  await ed.locator('[data-tab="furniture"]').click();
  await ed.locator('[data-island-item="park-bench"]').click();
  await ed.locator('[data-act="place"]').click();
  await ed.close();
  await page.bringToFront();
  await expect.poll(count).toBe(before + 1);
  // its model on the 3D island, at its id
  const id = await page.evaluate(() => (window as unknown as { __layout: { ids(k: string): string[] } }).__layout.ids('park-bench'));
  expect(id.length).toBe(before + 1);
  await expect.poll(() => page.evaluate((ids) => ids.filter((i) => (window as unknown as { __world3d: W3 }).__world3d.where(i)?.model).length, id), { timeout: 10_000 }).toBe(id.length);
});

test('on its layout my villager sits on a bench where the layout has it (its seat by layout/nav.ts seatsOf)', async ({ page }) => {
  await open(page);
  type V3 = { state(slot: string): string | null };
  await expect.poll(() => page.evaluate(() => (window as unknown as { __villagers3?: V3 }).__villagers3?.state('mine') ?? null), { timeout: 30_000 }).not.toBeNull();
  // (its left seat's spot: a step in front of the bench, by its facing; its walk graph's node)
  const seat = await page.evaluate(() => (window as unknown as { __world: { site(): { named: Record<string, [number, number]> } } }).__world.site().named.seatMaeL);
  const mid = await page.evaluate(() => (window as unknown as { __layout: { pos(id: string): [number, number] } }).__layout.pos('bench-mae'));
  expect(Math.hypot(seat[0] - mid[0], seat[1] - mid[1])).toBeLessThan(40);
  await page.evaluate(([x, z]) => (window as unknown as { __world: { put(x: number, z: number): void } }).__world.put(x, z), seat);
  await expect.poll(() => page.evaluate(() => (window as unknown as { __villagers3: V3 }).__villagers3.state('mine')), { timeout: 8000 }).toBe('sit');
});
