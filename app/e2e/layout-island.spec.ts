// The island on its editable layout (docs/island-layout.md "What the 3D integration must change"; island/site.svelte.ts):
// with the 3D island and `?layout`, the gameplay reads the long layout: the doors, the homes, the walk, the waters.
import { expect, test, type Page } from '@playwright/test';
import { is3d, tapOn } from './island';

type Site = { on: boolean; doors: Record<string, [number, number]>; homes: { A: [number, number]; B: [number, number] }; stage: [number, number]; named: Record<string, [number, number]> };
const site = (page: Page) => page.evaluate(() => (window as unknown as { __world: { site(): Site } }).__world.site());
const world = <R,>(page: Page, fn: string) => page.evaluate(`window.__world.${fn}`) as Promise<R>;
const ISLAND = './?demo&island=3d&layout&visitor=none&critter=none&date=2026-11-04T12:00';

test('the long layout: its doors, homes, centre stage and named spots', async ({ page }) => {
  await page.goto(ISLAND);
  expect(await is3d(page)).toBe(true);
  const s = await site(page);
  expect(s.on).toBe(true);
  // the campsite's door is ウェイ's home's on the layout (z 1404 and on), うめ's and the guest's homes in the middle
  expect(s.doors.campsite[1]).toBeGreaterThan(1350);
  expect(s.doors['home-B'][1]).toBeGreaterThan(700);
  expect(s.doors['home-G'][1]).toBeGreaterThan(700);
  expect(s.stage[1]).toBeGreaterThan(1200);
  for (const n of ['homeA', 'homeB', 'centreStage', 'pondside', 'door-campsite', 'seatPondL', 'stoolW', 'pullup', 'riverEast', 'mouth']) expect(s.named[n], n).toBeTruthy();
});

test('without ?layout the 3D island keeps world.ts’s island', async ({ page }) => {
  await page.goto('./?demo&island=3d&visitor=none&critter=none');
  expect(await is3d(page)).toBe(true);
  const s = await site(page);
  expect(s.on).toBe(false);
  expect(s.doors.campsite[1]).toBeLessThan(1000);
  expect(s.doors['home-B']).toBeUndefined();
});

test('うめ’s home: a tap walks up to its door and goes in to its room', async ({ page }) => {
  await page.goto(ISLAND);
  expect(await is3d(page)).toBe(true);
  const door = (await site(page)).doors['home-B'];
  await world(page, `go(${door[1] - 120})`);
  await expect.poll(() => page.evaluate('window.__world3d.camStill()')).toBe(true);
  await tapOn(page, page.locator('[data-building="home-B"] .door'));
  // my villager walks up to the door, then in
  await expect(page).toHaveURL(/\/tent\/?\?.*home=B/, { timeout: 15_000 });
  await expect(page.locator('[data-room-home="B"]')).toBeVisible();
});

test('a tap on the ground walks there on the layout’s walk (the long middle)', async ({ page }) => {
  await page.goto(ISLAND);
  expect(await is3d(page)).toBe(true);
  // a spot on the middle's open grass, west of the main path
  await world(page, 'put(135, 860)');
  await world(page, 'go(760)');
  await expect.poll(() => page.evaluate('window.__world3d.camStill()')).toBe(true);
  const [x, y] = await page.evaluate('window.__world3d.client(135, 960)') as [number, number];
  await page.mouse.click(x, y);
  await expect.poll(async () => {
    const [mx, mz] = await world<[number, number]>(page, 'mine()');
    return Math.hypot(mx - 135, mz - 960);
  }, { timeout: 10_000 }).toBeLessThan(20);
});
