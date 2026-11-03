// The 3D island on its layout (island/site.svelte.ts site.on: ?island=3d&layout until the cutover): the ground is the
// layout's (terrain.ts buildGround), its objects placeObjects' (one model an id: the rock is drawn once), the homes and
// NH's bridges and stairs stood on it (engine.ts placeGroup), the camera's far end at ウェイ's door; the もようがえ is
// the layout's own (layoutEdit/IslandEdit.svelte over this camera), a bench put down is drawn where it went.
import { expect, test, type Page } from '@playwright/test';

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
const Q = '?demo&date=2026-11-04T12:00&critter=none&visitor=none&island=3d';

async function open(page: Page, q = '&layout') {
  await page.goto(`${Q}${q}`);
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

test('the もようがえ on the layout is IslandEdit over the 3D island: a bench from the tray is put down and drawn there', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ }).click();
  await page.locator('[data-tab="settings"]').click();
  await page.locator('[data-decor-start]').click();
  await expect(page.locator('[data-island-edit]')).toBeVisible();
  // (not the decorations' mode)
  await expect(page.locator('[data-tray]')).toHaveCount(0);
  const before = await page.evaluate(() => (window as unknown as { __layout: { count(k: string): number } }).__layout.count('park-bench'));
  await page.locator('[data-tab="furniture"]').click();
  await page.locator('[data-island-item="park-bench"]').click();
  await page.locator('[data-act="place"]').click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __layout: { count(k: string): number } }).__layout.count('park-bench'))).toBe(before + 1);
  // its model on the 3D island, at its id
  const id = await page.evaluate(() => (window as unknown as { __layout: { ids(k: string): string[] } }).__layout.ids('park-bench'));
  expect(id.length).toBe(before + 1);
  await expect.poll(() => page.evaluate((ids) => ids.filter((i) => (window as unknown as { __world3d: W3 }).__world3d.where(i)?.model).length, id), { timeout: 10_000 }).toBe(id.length);
  // a placed thing dragged two tiles: it follows the finger, the camera stays put
  const t = await page.evaluate(() => {
    const o = (window as unknown as { __layout: { obj(id: string): { x: number; z: number } } }).__layout.obj('tape-deck');
    return [o.x, o.z] as [number, number];
  });
  type IE = { sel(): { x: number } | null; tileScreen(c: number, r: number): [number, number] | null };
  const scr = (c: number, r: number) => page.evaluate(([c, r]) => (window as unknown as { __islandEdit: IE }).__islandEdit.tileScreen(c, r), [c, r] as const);
  const from = (await scr(t[0], t[1]))!, to = (await scr(t[0] - 2, t[1]))!;
  const cam0 = await w3(page, (w) => (w as unknown as { view(): { camZ: number } }).view().camZ);
  await page.mouse.move(from[0], from[1]);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) await page.mouse.move(from[0] + ((to[0] - from[0]) * i) / 6, from[1] + ((to[1] - from[1]) * i) / 6);
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __islandEdit: IE }).__islandEdit.sel()?.x ?? null)).toBe(t[0] - 2);
  expect(await w3(page, (w) => (w as unknown as { view(): { camZ: number } }).view().camZ)).toBeCloseTo(cam0, 1);
});

test('on its layout my villager sits on a bench where the layout has it (its seat by layout/nav.ts seatsOf)', async ({ page }) => {
  await open(page);
  type V3 = { state(slot: string): string | null };
  await expect.poll(() => page.evaluate(() => (window as unknown as { __villagers3?: V3 }).__villagers3?.state('mine') ?? null), { timeout: 30_000 }).not.toBeNull();
  const seat = await page.evaluate(() => {
    const l = (window as unknown as { __layout: { pos(id: string): [number, number]; obj(id: string): { f: number } } }).__layout;
    const [mx, mz] = l.pos('bench-mae'), [fx, fz] = ([[0, -1], [1, 0], [0, 1], [-1, 0]] as const)[l.obj('bench-mae').f & 3];
    const sx = mx - fx * 16, sz = mz - fz * 16, ax = -fz, az = fx;
    return [sx - ax * 13, sz - az * 13] as [number, number];
  });
  await page.evaluate(([x, z]) => (window as unknown as { __world: { put(x: number, z: number): void } }).__world.put(x, z), seat);
  await expect.poll(() => page.evaluate(() => (window as unknown as { __villagers3: V3 }).__villagers3.state('mine')), { timeout: 8000 }).toBe('sit');
});
