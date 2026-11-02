// The tent (docs/design.md "The tent"): the campsite's door opens its inside, NH's largest room in 3D, as a screen of
// its own: the room's code and three.js come only then (the island never loads them); my villager walks where the
// floor is tapped; the doormat and ‹ 島へ go back out, to the island as it was.
import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

type T = { stats(): { frames: number; calls: number; tris: number; dpr: number }; mine(): [number, number]; walking(w: string): boolean; px(x: number, z: number, y?: number): [number, number]; loading(): number };
const tent = <R,>(page: Page, fn: (t: T) => R) => page.evaluate(`(${fn.toString()})(window.__tent)`) as Promise<R>;
const Q = '?demo&date=2026-11-04T12:00&critter=none&visitor=none';

/** Into the tent from the island: the camera up to the campsite, its door tapped. */
async function enter(page: Page) {
  await page.goto(Q);
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  await page.evaluate(() => (window as unknown as { __world: { go(z: number): void } }).__world.go(642));
  await page.waitForTimeout(300);
  await page.locator('[data-building="campsite"] .door').click();
  await expect(page).toHaveURL(/\/tent\?/);
  await page.waitForFunction(() => ((window as unknown as { __tent?: { stats(): { frames: number } } }).__tent?.stats()?.frames ?? 0) > 0);
  // the door's iris has opened
  await expect(page.locator('html')).not.toHaveAttribute('data-door', /./, { timeout: 4000 });
}

test('the island never loads the room; the tent does, opens through the door, and goes back out to the island as it was', async ({ page }) => {
  const scripts: string[] = [];
  page.on('response', async (r) => {
    if (r.url().endsWith('.js')) scripts.push((await r.text().catch(() => '')).includes('WebGLRenderer') ? 'three' : 'other');
  });
  await page.goto(Q);
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  await page.waitForTimeout(800);
  expect(scripts).not.toContain('three');
  await page.evaluate(() => (window as unknown as { __world: { go(z: number): void } }).__world.go(642));
  await page.waitForTimeout(300);
  const cam = await page.evaluate(() => (window as unknown as { __world: { cam(): number } }).__world.cam());
  await page.locator('[data-building="campsite"] .door').click();
  await expect(page).toHaveURL(/\/tent\?/);
  await page.waitForFunction(() => ((window as unknown as { __tent?: { stats(): { frames: number } } }).__tent?.stats()?.frames ?? 0) > 0);
  expect(scripts).toContain('three');
  await expect(page.locator('html')).not.toHaveAttribute('data-door', /./, { timeout: 4000 });
  // the device pixel ratio is capped (the iPhone 13 profile is 3)
  expect((await tent(page, (t) => t.stats())).dpr).toBeLessThanOrEqual(2);
  // out by the doormat (the front edge's middle)
  const [x, y] = await tent(page, (t) => t.px(0, 36.5));
  await page.mouse.click(x, y);
  await expect(page).toHaveURL(/\/fitness\/\?/);
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  expect(Math.abs((await page.evaluate(() => (window as unknown as { __world: { cam(): number } }).__world.cam())) - cam)).toBeLessThan(2);
  await expect(page.locator('[data-tent]')).toHaveCount(0);
});

test('a tap on the floor walks my villager there; ‹ 島へ goes back out; nothing is drawn while nothing moves', async ({ page }) => {
  await enter(page);
  await page.waitForFunction(() => !(window as unknown as { __tent: { walking(w: string): boolean } }).__tent.walking('A'));
  const [x, y] = await tent(page, (t) => t.px(25, -20));
  await page.mouse.click(x, y);
  await page.waitForTimeout(200);
  expect(await tent(page, (t) => t.walking('A'))).toBe(true);
  await page.waitForFunction(() => !(window as unknown as { __tent: { walking(w: string): boolean } }).__tent.walking('A'), null, { timeout: 5000 });
  const [mx, mz] = await tent(page, (t) => t.mine());
  expect(Math.hypot(mx - 25, mz + 20)).toBeLessThan(1.5);
  // still: no frames
  const f0 = (await tent(page, (t) => t.stats())).frames;
  await page.waitForTimeout(600);
  expect((await tent(page, (t) => t.stats())).frames).toBe(f0);
  // a drag turns the camera round the room (it walks nobody); the home button brings NH's view back
  const [cx, cy] = await tent(page, (t) => t.px(-20, 10));
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 120, cy + 20, { steps: 8 });
  await page.mouse.up();
  expect(await page.evaluate(() => (window as unknown as { __tent: { isDefault(): boolean } }).__tent.isDefault())).toBe(false);
  expect(await tent(page, (t) => t.walking('A'))).toBe(false);
  await page.locator('[data-tent-reset]').click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __tent: { isDefault(): boolean } }).__tent.isDefault())).toBe(true);
  await expect(page.locator('[data-tent-reset]')).toHaveCount(0);
  await page.getByRole('button', { name: '島へ' }).click();
  await expect(page).toHaveURL(/\/fitness\/\?/);
});

type Piece = { id: string; item: string; x: number; z: number; f: number };
type E = { tile(x: number, z: number): [number, number]; pieces(): Piece[]; edit(): { sel: (Piece & { fresh: boolean }) | null; why: string | null } | null; surfaces(): { wall: string | null; floor: string | null } };
const te = <R,>(page: Page, fn: (t: E) => R) => page.evaluate(`(${fn.toString()})(window.__tent)`) as Promise<R>;
const tile = (page: Page, x: number, z: number) => page.evaluate(([x, z]) => (window as unknown as { __tent: E }).__tent.tile(x, z), [x, z] as const);

test('edit: place a piece from the tray, turn it, drag it, put it away; the wallpaper; red where it can’t go; kept across a reload', async ({ page }) => {
  await enter(page);
  await page.evaluate(() => localStorage.removeItem('island-demo.tent'));
  await page.locator('[data-tent-edit-open]').click();
  await expect(page.locator('[data-tent-count]')).toHaveText('0/40');
  // the camping cot (2 × 1) as a ghost, tapped over to the back row, turned a quarter, placed
  await page.locator('[data-tent-item="f4081"]').click();
  expect((await te(page, (t) => t.edit()))?.sel).toMatchObject({ item: 'f4081', fresh: true, f: 0 });
  // (a 2 × 1 piece's middle on the line between tiles 1 and 2: tiles 1–2 of row 1)
  let [x, y] = await tent(page, (t) => t.px(-20, -25));
  await page.mouse.click(x, y);
  await expect.poll(() => te(page, (t) => t.edit()?.sel)).toMatchObject({ x: 1, z: 1 });
  await page.locator('[data-act="turn"]').click();
  await expect.poll(() => te(page, (t) => t.edit()?.sel?.f)).toBe(1);
  await page.locator('[data-act="place"]').click();
  await expect.poll(() => te(page, (t) => t.pieces())).toEqual([expect.objectContaining({ item: 'f4081', f: 1 })]);
  const placed = (await te(page, (t) => t.pieces()))[0];
  await expect(page.locator('[data-tent-count]')).toHaveText('1/40');
  // a finger on it drags it, a tile at a time, and ✓ puts it there
  [x, y] = await tile(page, placed.x, placed.z);
  const [x2, y2] = await tile(page, 6, 1);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move((x + x2) / 2, (y + y2) / 2, { steps: 4 });
  await page.mouse.move(x2, y2, { steps: 4 });
  await page.mouse.up();
  const held = (await te(page, (t) => t.edit()?.sel))!;
  expect(held.id).toBe(placed.id);
  expect(held.x).toBeGreaterThanOrEqual(5);
  await page.locator('[data-act="place"]').click();
  await expect.poll(() => te(page, (t) => t.pieces()[0].x)).toBe(held.x);
  // the doorway stays clear: red, the bar says why, ✓ greyed
  await page.locator('[data-tent-item="f4038"]').click();
  [x, y] = await tile(page, 3, 7);
  await page.mouse.click(x, y);
  await expect(page.locator('[data-why="door"]')).toBeVisible();
  await expect(page.locator('[data-act="place"]')).toHaveAttribute('aria-disabled', 'true');
  await page.locator('[data-act="cancel"]').click();
  // a wallpaper is on the walls at once
  await page.locator('[data-tab="wall"]').click();
  const wall = await page.locator('[data-tent-item]').nth(3).getAttribute('data-tent-item');
  await page.locator(`[data-tent-item="${wall}"]`).click();
  await expect.poll(() => te(page, (t) => t.surfaces().wall)).toBe(wall);
  await page.locator('[data-tent-done]').click();
  // kept: the room is the same after a reload
  await page.reload();
  await page.waitForFunction(() => ((window as unknown as { __tent?: { stats(): { frames: number } } }).__tent?.stats()?.frames ?? 0) > 0);
  await expect.poll(() => te(page, (t) => t.pieces().map((p) => p.item))).toEqual(['f4081']);
  expect(await te(page, (t) => t.surfaces().wall)).toBe(wall);
  // put away: picked up, 🗑, gone (とりけす on the banner)
  await page.locator('[data-tent-edit-open]').click();
  const p = (await te(page, (t) => t.pieces()))[0];
  [x, y] = await tile(page, p.x, p.z);
  await page.mouse.click(x, y);
  await expect.poll(() => te(page, (t) => t.edit()?.sel?.id)).toBe(p.id);
  await page.locator('[data-act="remove"]').click();
  await expect.poll(() => te(page, (t) => t.pieces())).toEqual([]);
  await expect(page.getByRole('button', { name: 'とりけす' })).toBeVisible();
});
